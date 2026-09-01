import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export interface UploadResult {
  /** GCS / local object key (source of truth). */
  key: string;
  /** Public/accessible URL. Only set for local development; GCS uses signed URLs. */
  url?: string;
  /** Bucket name (production only). */
  bucket?: string;
}

export interface PresignedUploadResult {
  /** Presigned URL the client uses to PUT the file. */
  uploadUrl: string;
  /** Object key the client must return to the backend after uploading. */
  key: string;
}

export interface SignedUrlResult {
  /** Temporary URL for reading the object. */
  url: string;
  /** ISO timestamp of expiration. */
  expiresAt: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly isGcs: boolean;
  private readonly gcsClient?: Storage;
  private readonly gcsBucket?: Bucket;
  private readonly bucketName?: string;
  private readonly localBase: string;

  constructor(private readonly config: ConfigService) {
    // STORAGE_PROVIDER=gcs opts into GCS explicitly; otherwise fall back to
    // production-only GCS when NODE_ENV=production. Local disk is used otherwise.
    const explicitProvider = this.config.get<string>('STORAGE_PROVIDER')?.toLowerCase();
    this.isGcs =
      explicitProvider === 'gcs' ||
      (!explicitProvider && this.config.get<string>('NODE_ENV') === 'production');
    this.localBase = path.join(process.cwd(), 'uploads');

    if (this.isGcs) {
      this.bucketName = this.config.get<string>('GCS_BUCKET_NAME');
      const projectId = this.config.get<string>('GCP_PROJECT_ID');
      const clientEmail = this.config.get<string>('GCS_CLIENT_EMAIL');
      let privateKey = this.config.get<string>('GCS_PRIVATE_KEY') ?? '';

      if (!this.bucketName || !clientEmail || !privateKey) {
        throw new Error(
          'Missing required GCS configuration. Set GCS_BUCKET_NAME, GCP_PROJECT_ID, GCS_CLIENT_EMAIL, and GCS_PRIVATE_KEY.',
        );
      }

      // Allow env files that escape newlines as literal \n
      privateKey = privateKey.replace(/\\n/g, '\n');

      this.gcsClient = new Storage({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      });

      this.gcsBucket = this.gcsClient.bucket(this.bucketName);
      this.logger.log(`[Storage] GCS mode — project: ${projectId}, bucket: ${this.bucketName}`);
    } else {
      this.logger.log('[Storage] Local disk mode');
    }
  }

  async upload(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    const ext = extname(file.originalname).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    if (this.isGcs) {
      return this.uploadToGcs(file, key);
    }
    return this.uploadToLocal(file, key);
  }

  async getPresignedUploadUrl(
    folder: string,
    originalName: string,
    mimeType: string,
    expiresInSeconds = 300,
  ): Promise<PresignedUploadResult> {
    const ext = extname(originalName).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    if (this.isGcs) {
      const [uploadUrl] = await this.gcsBucket!.file(key).getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: new Date(Date.now() + expiresInSeconds * 1000),
        contentType: mimeType,
      });

      this.logger.debug(`[Storage] GCS presigned upload URL generated for key: ${key}`);
      return { uploadUrl, key };
    }

    // Local dev: return the existing local-upload endpoint
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3001');
    const uploadUrl = `${appUrl}/storage/local-upload/${encodeURIComponent(key)}`;
    return { uploadUrl, key };
  }

  async getReadSignedUrl(key: string, expiresInSeconds?: number): Promise<SignedUrlResult> {
    const expirationMinutes = this.config.get<number>('GCS_SIGNED_URL_EXPIRATION_MINUTES', 15);
    const effectiveSeconds = expiresInSeconds ?? expirationMinutes * 60;

    if (this.isGcs) {
      const [url] = await this.gcsBucket!.file(key).getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: new Date(Date.now() + effectiveSeconds * 1000),
      });

      const expiresAt = new Date(Date.now() + effectiveSeconds * 1000).toISOString();
      return { url, expiresAt };
    }

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3001');
    const url = `${appUrl}/uploads/${key}`;
    const expiresAt = new Date(Date.now() + effectiveSeconds * 1000).toISOString();
    return { url, expiresAt };
  }

  async delete(key: string): Promise<void> {
    if (this.isGcs) {
      return this.deleteFromGcs(key);
    }
    return this.deleteFromLocal(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.isGcs) {
      try {
        const [result] = await this.gcsBucket!.file(key).exists();
        return result;
      } catch (err) {
        this.logger.warn(`[Storage] Failed to check GCS existence for ${key}: ${err}`);
        return false;
      }
    }

    return fs.promises
      .access(path.join(this.localBase, key))
      .then(() => true)
      .catch(() => false);
  }

  private async uploadToGcs(file: Express.Multer.File, key: string): Promise<UploadResult> {
    await this.gcsBucket!.file(key).save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    this.logger.debug(`[Storage] Uploaded to GCS: ${this.bucketName}/${key}`);
    return { key, bucket: this.bucketName };
  }

  private async uploadToLocal(file: Express.Multer.File, key: string): Promise<UploadResult> {
    const dest = path.join(this.localBase, path.dirname(key));
    await fs.promises.mkdir(dest, { recursive: true });

    const filePath = path.join(this.localBase, key);
    await fs.promises.writeFile(filePath, file.buffer);

    const url = `/uploads/${key}`;
    this.logger.debug(`[Storage] Saved locally: ${url}`);
    return { key, url };
  }

  private async deleteFromGcs(key: string): Promise<void> {
    try {
      await this.gcsBucket!.file(key).delete({ ignoreNotFound: true });
      this.logger.debug(`[Storage] Deleted from GCS: ${key}`);
    } catch (err) {
      this.logger.warn(`[Storage] Failed to delete GCS object ${key}: ${err}`);
      throw err;
    }
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const filePath = path.join(this.localBase, key);
    try {
      await fs.promises.unlink(filePath);
      this.logger.debug(`[Storage] Deleted local file: ${filePath}`);
    } catch (err) {
      this.logger.warn(`[Storage] Failed to delete local file ${filePath}: ${err}`);
    }
  }
}
