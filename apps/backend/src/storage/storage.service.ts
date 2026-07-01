import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export interface UploadResult {
  url: string;
  key: string;
  bucket?: string;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  finalUrl: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly isS3: boolean;
  private s3Client?: S3Client;
  private readonly bucket?: string;
  private readonly region?: string;
  private readonly localBase: string;

  constructor(private config: ConfigService) {
    this.isS3 = config.get<string>('NODE_ENV') === 'production';
    this.localBase = path.join(process.cwd(), 'uploads');

    if (this.isS3) {
      this.region  = config.get<string>('AWS_REGION', 'us-east-1');
      this.bucket  = config.get<string>('AWS_S3_BUCKET');
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId:     config.get<string>('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
      this.logger.log(`[Storage] S3 mode — bucket: ${this.bucket} (${this.region})`);
    } else {
      this.logger.log('[Storage] Local disk mode');
    }
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const ext      = extname(file.originalname).toLowerCase();
    const key      = `${folder}/${uuidv4()}${ext}`;

    if (this.isS3) {
      return this.uploadToS3(file, key);
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

    if (this.isS3) {
      const command = new PutObjectCommand({
        Bucket:      this.bucket!,
        Key:         key,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(this.s3Client!, command, { expiresIn: expiresInSeconds });
      const finalUrl  = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      this.logger.debug(`[Storage] Presigned URL generated for key: ${key}`);
      return { uploadUrl, finalUrl, key };
    }

    // Local dev: return a sentinel upload URL pointing to the local upload endpoint
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3001');
    const uploadUrl = `${appUrl}/storage/local-upload/${encodeURIComponent(key)}`;
    const finalUrl  = `${appUrl}/uploads/${key}`;
    return { uploadUrl, finalUrl, key };
  }

  async delete(key: string): Promise<void> {
    if (this.isS3) {
      await this.deleteFromS3(key);
    } else {
      this.deleteFromLocal(key);
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    const upload = new Upload({
      client: this.s3Client!,
      params: {
        Bucket:      this.bucket!,
        Key:         key,
        Body:        file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    this.logger.debug(`[Storage] Uploaded to S3: ${url}`);
    return { url, key, bucket: this.bucket };
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    const dest = path.join(this.localBase, path.dirname(key));
    await fs.promises.mkdir(dest, { recursive: true });

    const filePath = path.join(this.localBase, key);
    await fs.promises.writeFile(filePath, file.buffer);

    const url = `/uploads/${key}`;
    this.logger.debug(`[Storage] Saved locally: ${url}`);
    return { url, key };
  }

  private async deleteFromS3(key: string): Promise<void> {
    try {
      await this.s3Client!.send(new DeleteObjectCommand({
        Bucket: this.bucket!,
        Key:    key,
      }));
      this.logger.debug(`[Storage] Deleted from S3: ${key}`);
    } catch (err) {
      this.logger.warn(`[Storage] Failed to delete S3 key ${key}: ${err}`);
    }
  }

  private deleteFromLocal(key: string): void {
    const filePath = path.join(this.localBase, key);
    fs.unlink(filePath, (err) => {
      if (err) this.logger.warn(`[Storage] Failed to delete local file ${filePath}: ${err}`);
    });
  }
}
