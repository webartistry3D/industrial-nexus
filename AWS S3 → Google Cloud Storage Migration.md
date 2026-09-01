# AWS S3 → Google Cloud Storage Migration

## Task

Refactor the **Industrial Nexus** backend to replace **Amazon S3** object storage with **Google Cloud Storage (GCS)**.

GCS must become the **single active object-storage provider** in production. Local disk mode (development) must continue to work without credentials.

Do not perform unrelated refactoring.

---

## Primary Objective

Replace:

```text
Industrial Nexus → AWS S3
```

With:

```text
Industrial Nexus → StorageService abstraction → Google Cloud Storage
```

A single `StorageService` abstraction already exists and must be preserved (or slightly restructured) so business services and controllers never import the GCS SDK directly.

---

## 1. Current Codebase Audit

Before modifying code, verify the following. These are the **actual** current integrations.

### 1.1 Storage Service

File: `apps/backend/src/storage/storage.service.ts`

- `StorageService` is already a NestJS singleton in `StorageModule`.
- In production (`NODE_ENV === 'production'`) it uploads to S3.
- In development it writes to `process.cwd()/uploads`.
- Existing methods:
  - `upload(file, folder)` — direct multipart upload
  - `getPresignedUploadUrl(folder, originalName, mimeType, expiresInSeconds = 300)` — returns `{ uploadUrl, finalUrl, key }` for client-side uploads
  - `delete(key)` — removes the object
- S3 dependencies: `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner`.

### 1.2 Consumers of StorageService

| Controller | File | Folder used | Stored in database |
|---|---|---|---|
| `UsersController` | `users.controller.ts` | `avatars` | `User.profileImageUrl` |
| `VehiclesController` | `vehicles.controller.ts` | `vehicle-docs` | `VehicleDocument.fileUrl` |
| `DriversController` | `drivers.controller.ts` | `kyc-docs` | `KycDocument.fileUrl` |
| `TripsController` | `trips.controller.ts` | `pod-photos`, `pod-signatures` | `POD.imageUrl`, `POD.signatureUrl` |

### 1.3 Current Upload Flow (POD)

```text
GET  /trips/:id/pod/upload-url?filename=...&mimeType=...&type=photo|signature
    → StorageService.getPresignedUploadUrl()
    → { uploadUrl, finalUrl, key }

Client PUTS file to uploadUrl
Client POSTS /trips/:id/pod with photoUrl=finalUrl, signatureUrl=finalUrl
```

### 1.4 Current Environment Variables

File: `apps/backend/.env.example`

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET="industrial-nexus-documents"
```

### 1.5 Database Schema

File: `apps/backend/prisma/schema.prisma`

Models currently store **full public URLs**, not object keys:

- `POD.imageUrl` and `POD.signatureUrl`
- `KycDocument.fileUrl`
- `VehicleDocument.fileUrl`
- `User.profileImageUrl`

### 1.6 Notes

- `POD` is associated with a `Trip` via `tripId`, not a `Delivery`. There is no `deliveryId` field.
- The `seed.ts` file currently uses `https://placehold.co/...` URLs and a base64 data URI; that is seed data and does not use S3.

---

## 2. Install Google Cloud Storage

```bash
cd apps/backend
npm install @google-cloud/storage
```

Uninstall after the migration is complete and verified:

```bash
npm uninstall @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner multer-s3
```

---

## 3. Storage Architecture

The existing `StorageService` is already the public abstraction. The minimal change is to replace the S3 branches with GCS branches. Optionally, introduce a `StorageProvider` interface for clearer separation.

### 3.1 Recommended minimal structure

```text
src/storage/
├── storage.module.ts
├── storage.service.ts            (public API)
├── google-cloud-storage.service.ts   (or inline GCS provider)
└── storage.types.ts              (optional)
```

### 3.2 Public interface

The `StorageService` must expose at least the following to the rest of the backend:

```typescript
interface UploadResult {
  url: string;     // permanent public URL or local path (legacy, see §7)
  key: string;     // bucket object key
  bucket?: string;
}

interface PresignedUploadResult {
  uploadUrl: string; // PUT URL for the client
  key: string;       // bucket object key the client must return
}

interface ReadSignedUrlResult {
  url: string;       // temporary GET URL
  expiresAt: Date;
}

class StorageService {
  upload(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  getPresignedUploadUrl(folder: string, originalName: string, mimeType: string, expiresInSeconds?: number): Promise<PresignedUploadResult>;
  getReadSignedUrl(key: string, expiresInSeconds?: number): Promise<ReadSignedUrlResult>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

### 3.3 Important contract change

`PresignedUploadResult` currently returns `finalUrl`. For private GCS buckets, **do not return a permanent public `finalUrl`**. Return `key` instead. The client must send `key` back to the backend; the backend then generates a read-signed URL on demand.

---

## 4. Google Cloud Configuration

### 4.1 Required environment variables

```env
GCS_PROJECT_ID=
GCS_BUCKET_NAME=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_SIGNED_URL_EXPIRATION_MINUTES=15
```

### 4.2 Rules

- Never hardcode credentials.
- Never commit credentials.
- Never expose credentials to frontend applications.
- Update `apps/backend/.env.example` with placeholders only.
- Validate required configuration at application startup.
- Use a dedicated GCS service account with the minimum required permissions:
  - `storage.objects.create`
  - `storage.objects.delete`
  - `storage.objects.get`
  - `storage.objects.list`
  - `storage.objects.update`

### 4.3 Local development

When `NODE_ENV !== 'production'`, keep the existing local disk mode so credentials are not required for local development. The local mode must still generate `key` in the same `folder/uuid.ext` format as GCS mode for consistency.

---

## 5. Object-Key Pattern

Keep the existing key pattern. Do not introduce a `deliveryId` segment because `POD` is keyed by `tripId`, and `POD` has no `deliveryId`.

| Use case | Folder | Key pattern |
|---|---|---|
| Profile avatars | `avatars` | `avatars/{uuid}.{ext}` |
| KYC documents | `kyc-docs` | `kyc-docs/{uuid}.{ext}` |
| Vehicle documents | `vehicle-docs` | `vehicle-docs/{uuid}.{ext}` |
| POD photos | `pod-photos` | `pod-photos/{uuid}.{ext}` |
| POD signatures | `pod-signatures` | `pod-signatures/{uuid}.{ext}` |

Requirements:

- Generate collision-resistant unique filenames (already uses `uuid`).
- Do not use the original filename as the storage key.
- Preserve the actual file extension.
- Keep bucket name configurable via `GCS_BUCKET_NAME`.

---

## 6. Upload Requirements

Preserve existing upload behavior where possible.

Validate server-side:

- File authorization (role check).
- MIME type.
- File size.

Supported image types should include:

```text
image/jpeg
image/png
image/webp
```

Reject unsupported file types.

Do not trust filename extensions alone.

Do not store image binaries in PostgreSQL.

### 6.1 GCS upload implementation

For direct uploads:

```typescript
await bucket.file(key).save(file.buffer, {
  contentType: file.mimetype,
  resumable: false,
});
```

For presigned uploads:

```typescript
const [uploadUrl] = await bucket.file(key).getSignedUrl({
  version: 'v4',
  action: 'write',
  expires: Date.now() + expiresInSeconds * 1000,
  contentType: mimeType,
});
```

---

## 7. Database Rules

The database should store the **object key** as the source of truth, plus optional metadata, not a permanent public URL.

### 7.1 Schema changes required

Current `POD`, `KycDocument`, `VehicleDocument`, and `User` models store full public URLs (`imageUrl`, `signatureUrl`, `fileUrl`, `profileImageUrl`). Because GCS buckets must remain private, these fields cannot hold public GCS URLs.

Add `objectKey` fields to the affected models:

```prisma
model POD {
  ...
  imageKey      String?
  signatureKey  String?
  imageUrl      String?  // legacy — deprecated, remove after migration
  signatureUrl  String?  // legacy — deprecated, remove after migration
}

model KycDocument {
  ...
  fileKey  String
  fileUrl  String   // legacy — deprecated, remove after migration
}

model VehicleDocument {
  ...
  fileKey  String
  fileUrl  String   // legacy — deprecated, remove after migration
}

model User {
  ...
  profileImageKey String?
  profileImageUrl String?  // legacy — deprecated, remove after migration
}
```

### 7.2 Migration strategy

1. Create Prisma migration adding `objectKey` / `fileKey` / `imageKey` / `signatureKey` fields.
2. For existing S3 or local files, parse the object key from the existing `...Url` values.
3. Backfill the new `key` fields.
4. Update all write paths to populate both `key` and legacy `url` for backward compatibility during the transition.
5. After all clients consume `key`-based signed URLs, drop the legacy `url` columns.

### 7.3 Metadata to keep

```text
objectKey
originalFilename
mimeType
sizeBytes
uploadedAt
uploadedBy
```

---

## 8. Private Object Retrieval

The GCS bucket must remain private. Never make POD, KYC, vehicle, or avatar files publicly accessible.

### 8.1 Read flow

```text
Request image (GET /pods/:id/photo-url, /kyc/:id/download, etc.)
    ↓
Authenticate User
    ↓
Authorize Access (role + record ownership)
    ↓
Look up objectKey from database
    ↓
Generate Temporary Signed URL via StorageService
    ↓
Return signed URL
```

Generate signed URLs only after application-level authorization succeeds.

### 8.2 Example read method

```typescript
async getReadSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const [url] = await this.gcsBucket.file(key).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInSeconds * 1000,
  });
  return url;
}
```

Use `GCS_SIGNED_URL_EXPIRATION_MINUTES` (default 15 minutes).

---

## 9. File Deletion

Required flow:

```text
Authorization
    ↓
Delete Object from GCS
    ↓
Update/Delete Database Metadata
```

Implementation:

```typescript
async delete(key: string): Promise<void> {
  try {
    await this.gcsBucket.file(key).delete({ ignoreNotFound: true });
  } catch (err) {
    this.logger.warn(`Failed to delete GCS object ${key}: ${err}`);
    throw err;
  }
}
```

Do not silently ignore storage failures. Log and propagate errors appropriately.

---

## 10. Existing S3 Files

First determine whether existing production files exist in AWS S3.

### 10.1 If no existing files exist

Perform a clean migration. No data backfill is needed.

### 10.2 If existing files exist

Do not delete S3 files immediately.

Create an idempotent migration process:

```text
AWS S3
    ↓
Copy Object to GCS
    ↓
Verify GCS Upload
    ↓
Update Database Reference (set objectKey)
```

Only remove old S3 files after successful migration and verification.

For local seed/placeholder data (`placehold.co` URLs, base64 data URIs), leave as-is or replace with GCS-hosted files during seed refresh — do not migrate those.

---

## 11. Error Handling

Handle:

- Upload failures.
- Missing objects.
- Invalid files.
- Authentication failures (GCS credentials).
- Authorization failures (application level).
- GCS configuration errors.
- Signed URL failures.
- Object deletion failures.

Do not expose internal GCS errors, credentials, or stack traces in production API responses.

Log detailed diagnostics server-side.

Never log:

- Private keys.
- Credentials.
- Full signed URLs.

---

## 12. Testing

Update or create tests for:

- Object key generation.
- File validation.
- Upload (mock `Bucket#file().save()`).
- Presigned upload URL generation (mock `Bucket#file().getSignedUrl()` with `action: 'write'`).
- Read signed URL generation (mock `Bucket#file().getSignedUrl()` with `action: 'read'`).
- Object existence.
- Deletion.
- Storage failures.
- Config validation at startup.

Mock `@google-cloud/storage`. Do not require production cloud credentials for normal tests.

Example mock shape:

```typescript
const mockFile = {
  save: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  getSignedUrl: jest.fn(),
};
const mockBucket = {
  file: jest.fn().mockReturnValue(mockFile),
};
```

---

## 13. API Compatibility

Preserve existing API contracts where possible. The following **unavoidable** changes are required:

1. `GET /trips/:id/pod/upload-url` and similar presigned endpoints must return `key` instead of `finalUrl` because the bucket is private.
2. New endpoints are required for read access, e.g.:
   - `GET /trips/:id/pod/photo-url`
   - `GET /trips/:id/pod/signature-url`
   - `GET /kyc/:id/download`
   - `GET /vehicles/:id/documents/:docId/download`
   - `GET /users/me/avatar-url`
3. `POST /trips/:id/pod` must accept `photoKey` and `signatureKey` (or `objectKey` fields) and write those into the database. Keep `photoUrl`/`signatureUrl` as deprecated fallbacks only during transition.

The final frontend/backend relationship should be:

```text
Frontend
    ↓
Industrial Nexus API
    ↓
StorageService
    ↓
Google Cloud Storage
```

Not:

```text
Frontend
    ↓
Google Cloud Storage
```

---

## 14. Frontend Changes Required

The current driver PWA POD form consumes `finalUrl` from `getPodUploadUrl()` and immediately stores it in `podForm.photoUrl` / `podForm.signatureUrl`. This will break with private GCS.

Update the frontend to:

1. Call `GET /trips/:id/pod/upload-url` → receive `{ uploadUrl, key }`.
2. PUT the file to `uploadUrl`.
3. Call `POST /trips/:id/pod` with `photoKey` / `signatureKey` (and the `key` value only for UI fallback during transition).
4. To display a POD image or signature, call the new read-signed-URL endpoint each time the component renders the media.

Repeat the same pattern for avatars, KYC documents, and vehicle documents.

---

## 15. Cleanup

After verifying the migration:

1. Confirm all new uploads go to GCS.
2. Confirm authorized file retrieval works via signed URLs.
3. Confirm unauthorized users cannot access private files.
4. Confirm deletion works.
5. Confirm `key` is stored in PostgreSQL and public `url` columns are no longer written.
6. Remove obsolete S3-specific code.
7. Remove S3 environment variables.
8. Remove S3 SDK dependencies.
9. Update `apps/backend/.env.example`.
10. Update `API-REFERENCE.md` and `docs/architecture/database-architecture.md`.

---

## Acceptance Criteria

The task is complete only when:

- [ ] AWS S3 is no longer the active object-storage provider.
- [ ] Google Cloud Storage is fully integrated behind `StorageService`.
- [ ] Profile avatars, KYC docs, vehicle docs, and POD images upload successfully.
- [ ] Uploaded files remain private (no public bucket or public URLs).
- [ ] Authorized users receive temporary signed URLs for downloads.
- [ ] Unauthorized users cannot retrieve files.
- [ ] Files can be deleted from GCS and references are updated in PostgreSQL.
- [ ] PostgreSQL stores object keys, not image binaries.
- [ ] Storage logic stays isolated behind the existing `StorageService` abstraction.
- [ ] Frontend presigned upload flow is updated to use `key` instead of `finalUrl`.
- [ ] Tests pass with mocked GCS client.
- [ ] No remaining AWS S3 references in runtime code or dependencies.

## Strict Implementation Rule

Make the smallest set of changes necessary to complete this migration correctly.

Do not redesign unrelated modules.

Do not introduce additional storage providers.

Do not introduce public buckets.

Do not expose Google Cloud credentials to any frontend application.

Before finishing, inspect the complete backend codebase for remaining AWS S3 references and remove or update only those that are obsolete as a result of this migration.
