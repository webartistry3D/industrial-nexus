# Storage Architecture

## Overview

Industrial Nexus uses a **dual-mode object storage layer** designed to work identically in local development and production without code changes in the application. The backend stores all user-generated files (avatars, KYC documents, vehicle documents, proof-of-delivery photos, and signatures) through a single `StorageService` that switches between **local disk** (development) and **AWS S3** (production) based on the `NODE_ENV` environment variable.

File metadata is persisted in **PostgreSQL** alongside the entity it belongs to, while the actual binary content is stored in the configured object store. URLs stored in the database are either absolute public S3 URLs or local `/uploads/*` paths served by the backend.

## Storage Strategy

| Mode | Environment | Backend | File Location | Public Access |
|------|-------------|---------|---------------|---------------|
| Local Disk | `NODE_ENV != 'production'` | `StorageService` | `apps/backend/uploads/` | Via `StorageController` (`/uploads/*`) and static Express serving |
| AWS S3 | `NODE_ENV === 'production'` | `StorageService` + AWS SDK | S3 bucket | Public S3 object URLs (`https://<bucket>.s3.<region>.amazonaws.com/<key>`) |

Switching between modes requires only environment variables; no application code changes.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Object Storage (production) | AWS S3 |
| AWS SDK | `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` |
| Local Storage | Node.js `fs` + `multer` memory storage |
| Unique Keying | UUID v4 + original extension |
| File Upload Parsing | `multer` with `memoryStorage()` |
| Metadata Storage | PostgreSQL / Prisma |
| Public URL Hosting | S3 public URLs (prod) or local backend static route (dev) |

## Core Storage Service

All storage operations are centralized in `apps/backend/src/storage/storage.service.ts`.

### `StorageService` API

| Method | Signature | Purpose |
|--------|-----------|---------|
| `upload` | `(file: Express.Multer.File, folder: string) => UploadResult` | Server-side direct upload. Stores the file and returns the final URL and storage key. |
| `getPresignedUploadUrl` | `(folder, originalName, mimeType, expiresInSeconds?) => PresignedUploadResult` | Generates a presigned URL so the client can upload directly to S3 or to the local upload endpoint. |
| `delete` | `(key: string) => Promise<void>` | Deletes the file from the active backend (S3 or local disk). |

### Keying Convention

Files are stored under logical folders:

- `avatars/` — user profile images (`POST /users/me/avatar`)
- `kyc-docs/` — driver KYC documents (`POST /drivers/:id/kyc/documents/upload`)
- `vehicle-docs/` — vehicle registration, insurance, etc. (`POST /vehicles/:id/documents/upload`)
- `pod-photos/` — proof-of-delivery photos (`GET /trips/:id/pod/upload-url`)

Key format: `{folder}/{uuidv4()}{originalExtension}`

Example: `pod-photos/7c9c1f7b-4b2d-4c7b-9f1a-3d9e6b4b3f7e.jpg`

## Storage Module

`StorageModule` is a **global NestJS module** registered in `AppModule` so that `StorageService` can be injected into any controller or service without importing `StorageModule` locally.

```ts
// apps/backend/src/app.module.ts
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [StorageModule, ...],
})
export class AppModule {}
```

```ts
// apps/backend/src/storage/storage.module.ts
@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

## Upload Patterns

### 1. Server-Side Multipart Upload

Used for avatars, KYC documents, and vehicle documents. The client sends a `multipart/form-data` request; the backend uses `multer` `memoryStorage()` to hold the file in memory and then forwards it to `StorageService.upload()`.

```ts
@Post('me/avatar')
@UseInterceptors(FileInterceptor('avatar', {
  storage: memoryStorage(),
  fileFilter: (req, file, cb) => { /* allowed image types */ },
  limits: { fileSize: 5 * 1024 * 1024 },
}))
async uploadAvatar(
  @CurrentUser() user: { userId: string },
  @UploadedFile() file: Express.Multer.File,
) {
  const { url: profileImageUrl } = await this.storageService.upload(file, 'avatars');
  return this.usersService.updateMyProfile(user.userId, { profileImageUrl });
}
```

### 2. Presigned / Direct Client Upload

Used for POD photos from the driver PWA. The backend generates a temporary upload URL that the client uses to upload the binary directly.

- **Production**: AWS S3 presigned `PUT` URL (default 5-minute expiry).
- **Local development**: The backend returns a sentinel URL pointing to `PUT /storage/local-upload/:key`, which streams the raw request body to `apps/backend/uploads/:key`.

Flow:

1. Driver selects a photo.
2. Frontend calls `GET /trips/:id/pod/upload-url?filename=...&mimeType=...`.
3. Backend returns `{ uploadUrl, finalUrl, key }`.
4. Frontend `PUT`s the file to `uploadUrl`.
5. Frontend submits the trip POD with `photoUrl: finalUrl`.

## Database Storage Model

Files are referenced by URL in PostgreSQL. No binary data is stored in the database.

| Entity | Field | Content Type |
|--------|-------|--------------|
| `User` | `profileImageUrl` | Avatar image |
| `KycDocument` | `fileUrl`, `fileName`, `fileSize`, `mimeType` | KYC document file |
| `VehicleDocument` | `fileUrl`, `fileName`, `fileSize`, `mimeType` | Vehicle document file |
| `POD` | `imageUrl`, `signatureUrl` | POD photo + signature image |

Only the final public URL is stored; the storage key is not stored separately, but can be derived from the URL if needed for deletion.

## Local Development File Serving

In local mode, the backend exposes `PUT /storage/local-upload/:key(*)` (protected by `JwtAuthGuard`) to accept raw file uploads. The static files are served from the `uploads/` directory at the project root via Express static middleware.

Files are written to:

```
apps/backend/uploads/
├── avatars/
├── kyc-docs/
├── vehicle-docs/
└── pod-photos/
```

Public URLs returned to the client look like `/uploads/pod-photos/<uuid>.jpg` and are served by the local backend.

## Production S3 Configuration

In production, `StorageService` constructs an S3 client with the configured credentials and bucket.

| Environment Variable | Purpose | Default |
|----------------------|---------|---------|
| `NODE_ENV` | Switches to S3 when set to `'production'` | — |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_S3_BUCKET` | Target bucket | — |
| `AWS_ACCESS_KEY_ID` | IAM access key | — |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | — |

The bucket is expected to allow public read access on objects. Final URLs are constructed as:

```
https://<AWS_S3_BUCKET>.s3.<AWS_REGION>.amazonaws.com/<key>
```

## Security & Validation

- **Authentication**: All upload endpoints require a valid JWT. The local upload endpoint requires `JwtAuthGuard`.
- **Role-based authorization**: Roles are enforced with `RolesGuard` (e.g., only `SUPER_ADMIN`, `OPERATIONS`, or `DRIVER` can submit POD).
- **File type filtering**: Each controller restricts allowed extensions (e.g., `.jpg`, `.jpeg`, `.png`, `.webp` for avatars; `.pdf`, `.jpg`, `.jpeg`, `.png` for documents).
- **File size limits**: Avatars are limited to 5 MB; KYC and vehicle documents to 10 MB.
- **Direct binary streaming**: In local mode, the file is streamed to disk from the raw request body to avoid loading large files into memory.

## Deletion & Lifecycle

`StorageService.delete(key)` removes the object from the active backend. Currently, deletion is invoked only when the application explicitly calls it; there is no automatic lifecycle policy implemented in the backend. In production, S3 bucket lifecycle rules should be configured separately for stale or temporary files.

## Files by Concern

| Concern | File Path |
|---------|-----------|
| Service implementation | `apps/backend/src/storage/storage.service.ts` |
| Module & controller | `apps/backend/src/storage/storage.module.ts` |
| Local upload endpoint | `apps/backend/src/storage/storage.controller.ts` |
| Avatars | `apps/backend/src/users/users.controller.ts` |
| KYC documents | `apps/backend/src/drivers/drivers.controller.ts` |
| Vehicle documents | `apps/backend/src/vehicles/vehicles.controller.ts` |
| POD presigned upload | `apps/backend/src/trips/trips.controller.ts` |
| Schema metadata | `apps/backend/prisma/schema.prisma` |
| Driver PWA upload client | `apps/driver-pwa/src/lib/api.ts` |

## Future Considerations

- **Private S3 objects**: Currently all stored objects are expected to be publicly readable. For sensitive documents, switch to presigned read URLs and require authenticated access.
- **Bucket lifecycle rules**: Configure S3 to archive or delete old POD images and expired documents based on compliance requirements.
- **File integrity**: Add checksums (SHA-256) to the metadata model for audit trails.
- **CDN**: Introduce a CloudFront or equivalent CDN in front of S3 for production asset delivery.
