# Industrial Nexus — Amazon S3 → Cloudflare R2 Refactor Specification

**Document:** `R2-MIGRATION.md`  
**Project:** Industrial Nexus v1.0 MVP  
**Purpose:** Instruct the coding agent to replace Amazon S3 with Cloudflare R2 while preserving existing application behavior.

---

## 1. Objective

Refactor Industrial Nexus so that **Cloudflare R2 becomes the primary object/file storage provider instead of Amazon S3**.

Cloudflare R2 is S3-compatible. The preferred implementation is therefore to **retain the existing AWS S3 SDK and storage abstraction wherever practical**, changing the storage endpoint and credentials rather than rewriting the entire file-storage subsystem.

### Core requirement

> **Amazon S3 must no longer be required for normal Industrial Nexus operation after this migration.**

Do **not** implement R2 as a secondary/fallback storage provider unless the existing architecture explicitly requires provider failover.

---

# 2. Non-Goals

Do NOT:

- Add dual S3/R2 storage.
- Upload every file to both S3 and R2.
- Rewrite unrelated application modules.
- Replace the AWS SDK unnecessarily.
- Introduce a new storage abstraction if an adequate abstraction already exists.
- Change the application's file URLs/API contracts unless required.
- Change authentication, authorization, database schemas, business logic, or unrelated infrastructure.
- Migrate unrelated AWS services.
- Delete existing Amazon S3 objects automatically.
- Hard-code R2 credentials.
- Commit `.env` or secret files.
- Introduce unnecessary dependencies.

---

# 3. Target Architecture

The desired flow is:

```text
Industrial Nexus Application
        |
        v
Existing Storage Service / Adapter
        |
        v
AWS S3 SDK
        |
        | S3-compatible API
        v
Cloudflare R2
        |
        v
R2 Bucket
```

The application should interact with the storage provider through the existing storage service/abstraction wherever one exists.

The rest of the application should **not** need to know whether the underlying provider is S3 or R2.

---

# 4. First Task — Inspect Before Modifying

Before changing code, inspect the entire repository.

Identify:

### Storage implementation

Search for:

```text
@aws-sdk/client-s3
aws-sdk
S3Client
PutObjectCommand
GetObjectCommand
DeleteObjectCommand
HeadObjectCommand
CopyObjectCommand
CreateMultipartUploadCommand
UploadPartCommand
CompleteMultipartUploadCommand
AbortMultipartUploadCommand
getSignedUrl
S3RequestPresigner
```

Also search for:

```text
s3
S3
bucket
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ENDPOINT
AWS_S3_BUCKET
STORAGE_BUCKET
STORAGE_REGION
STORAGE_ENDPOINT
```

### Configuration

Locate:

- `.env`
- `.env.example`
- configuration modules
- NestJS `ConfigModule`
- configuration validation
- Docker configuration
- deployment configuration
- CI/CD configuration

### Application usage

Find every place where files are:

- uploaded
- downloaded
- deleted
- copied
- replaced
- checked for existence
- generated
- served through signed URLs
- attached to database records

### Database

Inspect Prisma schema/models for:

- file URLs
- object keys
- bucket names
- storage provider fields
- MIME types
- file metadata

**Do not change the database schema unless the current implementation stores provider-specific values that genuinely prevent R2 compatibility.**

---

# 5. Preserve the Existing Storage Contract

If Industrial Nexus already has something similar to:

```text
StorageService
FileStorageService
S3Service
ObjectStorageService
```

preserve its public interface.

For example, if existing application code calls:

```ts
storage.upload(...)
storage.delete(...)
storage.getSignedUrl(...)
```

continue exposing the same methods.

The migration should ideally be:

```text
Before:

Application → StorageService → Amazon S3

After:

Application → StorageService → Cloudflare R2
```

not:

```text
Application → R2-specific code scattered throughout the application
```

---

# 6. Cloudflare R2 Configuration

Cloudflare R2 uses an S3-compatible endpoint.

The endpoint follows this general format:

```text
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

The exact endpoint must come from the Cloudflare R2 account configuration.

Do not invent or hard-code the account ID.

---

# 7. Environment Variables

Use provider-neutral names where practical.

Preferred configuration:

```env
STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
STORAGE_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
STORAGE_BUCKET=<R2_BUCKET_NAME>
```

If the existing project uses AWS-prefixed variables throughout the storage layer, refactor them to provider-neutral names where doing so is clean and safe.

For example:

```env
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_ENDPOINT
AWS_S3_BUCKET
```

may become:

```env
STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY
STORAGE_REGION
STORAGE_ENDPOINT
STORAGE_BUCKET
```

Do not rename environment variables blindly. Inspect all usages first.

Update:

```text
.env.example
Docker configuration
deployment configuration
CI/CD configuration
documentation
tests
```

as appropriate.

Never commit actual credentials.

---

# 8. S3 Client Configuration

The existing AWS SDK S3 client should be configured for R2.

Conceptually:

```ts
const client = new S3Client({
  region: process.env.STORAGE_REGION ?? "auto",
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
});
```

The exact implementation must follow the project's existing configuration architecture.

### Important

Do not create a second S3 client solely for R2 if the existing storage service can be cleanly reconfigured.

---

# 9. Force Path-Style Addressing If Required

Cloudflare R2 commonly works with S3-compatible addressing.

If the existing implementation has compatibility problems with virtual-hosted-style addressing, configure:

```ts
forcePathStyle: true
```

only if necessary or if confirmed compatible with the current deployment.

Do not add configuration blindly without testing.

---

# 10. Credentials

Cloudflare R2 credentials are **not the same as normal AWS credentials**.

Use an R2 API token/access key with appropriate bucket permissions.

The agent must never:

- print credentials
- commit credentials
- place credentials in source code
- place credentials in frontend code
- expose secret keys through API responses
- expose secret keys through logs

Only the backend/server-side application may access the R2 secret key.

---

# 11. Bucket Configuration

Use a dedicated R2 bucket for Industrial Nexus.

Example:

```text
industrial-nexus
```

or the project's existing storage bucket naming convention.

The bucket name must come from:

```env
STORAGE_BUCKET
```

Do not hard-code the bucket name.

---

# 12. Object Key Strategy

Preserve the existing object-key strategy if it is already sound.

Example:

```text
industrial-nexus/
  users/
  organizations/
  orders/
  invoices/
  documents/
  uploads/
```

Do not unnecessarily rename existing object keys.

If the existing implementation stores:

```text
uploads/<uuid>-<filename>
```

continue using that strategy.

The migration should change the storage backend, not the application's file organization.

---

# 13. Upload Requirements

Verify that uploads correctly support:

- file buffer/stream
- object key
- MIME type
- content length where available
- metadata where currently used
- cache-control where currently used

Example conceptual operation:

```ts
new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: file,
  ContentType: mimeType,
});
```

Preserve existing upload behavior.

Do not add public-read ACLs unless the application explicitly requires public files.

---

# 14. ACL Considerations

Cloudflare R2 should not be treated like a traditional S3 bucket with arbitrary ACL assumptions.

If the current code uses:

```ts
ACL: "public-read"
```

or similar ACL logic:

1. Identify why it exists.
2. Determine whether the application actually requires public access.
3. Remove provider-specific ACL assumptions if unnecessary.
4. Replace them with the appropriate R2 access mechanism.

For private Industrial Nexus files, prefer:

```text
Private R2 bucket
        ↓
Backend authorization
        ↓
Signed URL / controlled download
```

---

# 15. Signed URLs

If the application currently generates S3 presigned URLs, preserve this functionality.

Continue using the AWS SDK's presigning mechanism where compatible with R2.

Example conceptual pattern:

```ts
const command = new GetObjectCommand({
  Bucket: bucket,
  Key: key,
});

const url = await getSignedUrl(client, command, {
  expiresIn: expiration,
});
```

Verify that generated URLs actually work against the R2 endpoint.

### Security requirements

- Never generate signed URLs without authorization checks.
- Preserve existing expiration limits.
- Do not expose bucket credentials.
- Do not make private files publicly accessible merely to simplify downloads.

---

# 16. Downloads

Verify:

```text
GetObject
```

behavior.

If downloads are streamed through the backend, preserve streaming.

If downloads use signed URLs, preserve the current API contract.

Do not download the entire file into memory unnecessarily.

---

# 17. Deletions

Verify:

```text
DeleteObject
```

behavior.

Deletion must continue to happen when the application currently expects it.

If database records and files are deleted in a specific sequence, preserve the existing transactional/error-handling behavior.

Do not silently ignore storage deletion failures unless that is already the application's intended behavior.

---

# 18. File Existence / Metadata

If the current application uses:

```text
HeadObject
```

or equivalent checks, preserve them.

Verify that R2 supports the exact operations being used.

Do not replace storage existence checks with database-only checks unless intentionally designed.

---

# 19. Multipart Uploads

Search for multipart upload logic.

If the project does NOT currently use multipart uploads:

> Do not introduce them as part of this migration.

If it DOES use them:

- verify R2 compatibility
- preserve the existing behavior
- test incomplete uploads
- test aborted uploads
- test large files

---

# 20. Public Files vs Private Files

Classify the existing file types.

Example:

```text
Public:
- company logos
- product images
- public marketing assets

Private:
- invoices
- business documents
- user uploads
- internal records
```

Do not change visibility semantics during the migration.

The migration must preserve the current security model.

---

# 21. CORS

Inspect whether browser clients upload directly to S3.

If uploads are:

```text
Browser → S3
```

or:

```text
Browser → presigned S3 URL
```

then R2 bucket CORS configuration may be required.

If uploads are:

```text
Browser → Industrial Nexus API → R2
```

then R2 CORS may not be necessary for uploads.

Determine which architecture the project actually uses before changing CORS.

If direct browser access is used, configure R2 CORS for the actual Industrial Nexus frontend origins only.

Do not use:

```text
*
```

unless there is a documented reason.

---

# 22. Database Compatibility

Inspect all database fields containing:

```text
url
fileUrl
file_url
objectKey
object_key
bucket
storageUrl
```

### Preferred approach

Store an object key rather than a permanent provider-specific URL whenever the existing architecture permits.

For example:

```text
documents/abc123/invoice.pdf
```

rather than:

```text
https://amazon-s3-provider/.../invoice.pdf
```

However:

> Do NOT perform a database redesign solely because R2 is being introduced.

If the existing schema already stores object keys, preserve it.

If it stores S3 URLs, determine whether the URLs are generated dynamically or persisted before deciding whether a migration is required.

---

# 23. Existing S3 Data

This task is primarily an **application provider refactor**.

Do not automatically delete or migrate existing S3 objects.

First determine whether existing production/development data exists.

If existing S3 objects are present, document one of:

```text
A. Existing files will remain in S3 temporarily.
B. Existing files will be manually migrated to R2.
C. A dedicated migration script will be created separately.
```

Do not mix an irreversible data migration into the code refactor unless explicitly requested.

---

# 24. Backward Compatibility

If old S3 URLs are stored in the database, the agent must identify them.

Search for:

```text
amazonaws.com
s3.amazonaws.com
s3.<region>.amazonaws.com
```

Determine whether these URLs are:

- generated dynamically
- stored in the database
- returned through APIs
- embedded in frontend state
- embedded in documents

Do not break existing records accidentally.

---

# 25. Configuration Validation

If the project uses environment validation, add:

```text
STORAGE_ENDPOINT
STORAGE_REGION
STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY
STORAGE_BUCKET
```

with appropriate validation.

The application should fail clearly at startup if required storage configuration is missing.

Do not expose secret values in validation errors.

---

# 26. Logging

Storage logs may include:

```text
operation
object key
bucket
duration
status
error type
```

Do NOT log:

```text
access key
secret key
authorization headers
presigned URLs
```

Presigned URLs contain sensitive query parameters and should not be logged.

---

# 27. Error Handling

Preserve the existing application's error-handling behavior.

Verify failures for:

- invalid credentials
- invalid bucket
- missing object
- upload failure
- download failure
- deletion failure
- timeout
- network failure
- malformed configuration

Storage errors should not expose internal credentials or provider secrets to API clients.

---

# 28. Testing Requirements

Add or update tests for the storage layer.

At minimum verify:

### Upload

```text
File → R2
```

### Download

```text
R2 → Application
```

### Delete

```text
Object → deleted from R2
```

### Signed URL

```text
Generate signed URL → access object successfully
```

### Missing object

```text
Request missing object → expected application error
```

### Configuration

```text
Missing storage credentials → clear startup/configuration failure
```

---

# 29. Integration Test

After implementation, perform a real R2 integration test using a development/test bucket.

Test:

```text
1. Start Industrial Nexus backend.
2. Authenticate.
3. Upload a test file.
4. Confirm object exists in R2.
5. Retrieve/download the file.
6. Generate a signed URL if supported.
7. Access the signed URL.
8. Delete the file.
9. Confirm deletion.
```

Use a harmless test file.

Do not use production files for automated tests.

---

# 30. Frontend Verification

Inspect all frontend functionality affected by storage:

- file upload forms
- document upload
- image upload
- profile/company logo upload
- attachment previews
- downloads
- delete buttons
- signed URL handling

The frontend should not need to know that the backend changed from S3 to R2.

If it currently references S3-specific URLs or SDKs, refactor those references.

---

# 31. Deployment

Update deployment environment variables in the project's actual deployment environment.

The agent must inspect the project's deployment configuration before changing anything.

Possible deployment configuration includes:

```text
Render
Docker
GitHub Actions
environment configuration
```

Do not assume the deployment provider.

Ensure production has:

```env
STORAGE_ENDPOINT
STORAGE_REGION
STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY
STORAGE_BUCKET
```

Do not put secrets into Git.

---

# 32. Docker

If Docker is used:

- verify environment variables are passed correctly
- do not copy `.env` into production images
- do not bake credentials into Dockerfiles
- verify the application starts without AWS-specific assumptions

---

# 33. CI/CD

If CI/CD tests storage functionality:

- inspect existing secrets
- replace S3 credentials where appropriate
- use dedicated test R2 credentials/bucket
- never print secrets in CI logs

Do not require real storage credentials for unit tests if mocks already exist.

---

# 34. Documentation

Update all relevant documentation.

Search documentation for:

```text
Amazon S3
AWS S3
S3 bucket
AWS credentials
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Replace outdated storage instructions with Cloudflare R2 instructions.

Document:

- required environment variables
- R2 endpoint format
- bucket setup
- API token/access key requirements
- local development configuration
- deployment configuration

Do not document real credentials.

---

# 35. Dependency Review

Inspect `package.json`.

If the project already uses:

```text
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

keep them unless there is a concrete reason to replace them.

Cloudflare R2's S3 compatibility means the existing AWS SDK is normally suitable.

Remove obsolete S3-specific dependencies only when they are genuinely no longer needed.

Do not replace the SDK simply for cosmetic reasons.

---

# 36. Code Quality Requirements

Follow the existing project's:

- TypeScript conventions
- NestJS architecture
- dependency injection patterns
- error handling
- configuration patterns
- naming conventions
- testing conventions

Avoid:

```text
any
```

where an existing typed solution is available.

Do not introduce dead code.

Do not leave commented-out S3 implementations.

Do not leave unused imports.

Run formatting and linting according to the existing project.

---

# 37. Recommended Refactor Pattern

Prefer a provider-neutral configuration:

```ts
export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}
```

Then initialize:

```ts
const s3Client = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});
```

The storage service remains responsible for:

```text
upload
download
delete
exists
signed URL
```

The rest of the application consumes the service without knowing that R2 is underneath.

---

# 38. Migration Checklist

## Discovery

- [ ] Locate all S3-related code.
- [ ] Locate all storage configuration.
- [ ] Locate all environment variables.
- [ ] Locate all upload flows.
- [ ] Locate all download flows.
- [ ] Locate all deletion flows.
- [ ] Locate signed URL generation.
- [ ] Locate direct frontend-to-S3 uploads.
- [ ] Locate persisted S3 URLs.
- [ ] Locate deployment configuration.

## Implementation

- [ ] Configure S3 SDK for R2.
- [ ] Add R2 endpoint configuration.
- [ ] Add R2 credentials configuration.
- [ ] Add R2 bucket configuration.
- [ ] Preserve storage service interface.
- [ ] Preserve object-key strategy.
- [ ] Preserve private/public visibility semantics.
- [ ] Preserve signed URL behavior.
- [ ] Remove unnecessary S3-specific assumptions.
- [ ] Update environment validation.
- [ ] Update `.env.example`.

## Security

- [ ] No credentials in source code.
- [ ] No credentials in Git.
- [ ] No secrets in logs.
- [ ] No secret keys exposed to frontend.
- [ ] Private files remain private.
- [ ] Signed URLs remain appropriately restricted.
- [ ] CORS is restrictive where direct browser access exists.

## Testing

- [ ] Unit tests pass.
- [ ] Upload tested.
- [ ] Download tested.
- [ ] Delete tested.
- [ ] Signed URL tested.
- [ ] Missing object tested.
- [ ] Configuration failure tested.
- [ ] Real R2 integration test completed.
- [ ] Frontend upload/download flows verified.

## Deployment

- [ ] Production environment updated.
- [ ] Development environment updated.
- [ ] CI/CD updated where necessary.
- [ ] Docker configuration verified.
- [ ] No AWS S3 dependency remains in normal runtime configuration.

## Documentation

- [ ] Storage setup documentation updated.
- [ ] Environment variables documented.
- [ ] S3 references removed or clearly marked historical.
- [ ] R2 setup documented.

---

# 39. Acceptance Criteria

The migration is complete only when all of the following are true:

### Functional

- Industrial Nexus can upload files to Cloudflare R2.
- Industrial Nexus can retrieve files from R2.
- Industrial Nexus can delete files from R2.
- Existing signed URL functionality works where applicable.
- Existing application file workflows continue to work.
- Existing authorization behavior remains unchanged.

### Architectural

- The application uses the existing storage abstraction where available.
- R2 is the primary storage provider.
- Amazon S3 is not required for normal operation.
- Storage-provider-specific code is isolated to the storage layer.
- No unnecessary duplicate storage implementation exists.

### Security

- R2 secret credentials are server-side only.
- No credentials are committed.
- No credentials appear in logs.
- Private files remain protected.
- Existing access-control behavior is preserved.

### Quality

- TypeScript compiles successfully.
- Linting passes.
- Existing tests pass.
- New/updated storage tests pass.
- Production build succeeds.
- Documentation is accurate.

---

# 40. Agent Execution Protocol

Execute this task in the following order:

```text
PHASE 1
Inspect repository and identify all S3/storage dependencies.

PHASE 2
Map the existing storage architecture and application call sites.

PHASE 3
Determine whether storage abstraction already exists.

PHASE 4
Refactor storage configuration to support Cloudflare R2.

PHASE 5
Configure the existing S3-compatible SDK for R2.

PHASE 6
Remove unnecessary Amazon S3-specific assumptions.

PHASE 7
Update environment validation and example configuration.

PHASE 8
Update tests.

PHASE 9
Run typecheck, lint, unit tests and build.

PHASE 10
Perform a real R2 integration test if credentials/test bucket are available.

PHASE 11
Inspect the final diff for accidental changes.

PHASE 12
Update documentation.

PHASE 13
Report exactly what was changed and any manual steps remaining.
```

---

# 41. Important Agent Rules

1. **Inspect first. Do not assume the project's storage architecture.**
2. **Do not rewrite unrelated code.**
3. **Do not introduce dual S3/R2 storage.**
4. **Do not migrate production data automatically.**
5. **Do not hard-code credentials.**
6. **Do not expose R2 credentials to the frontend.**
7. **Do not break existing file APIs.**
8. **Preserve existing object keys where possible.**
9. **Preserve existing access-control behavior.**
10. **Prefer the existing AWS S3 SDK because R2 is S3-compatible.**
11. **Keep provider-specific logic isolated to the storage layer.**
12. **Use environment variables for all R2 configuration.**
13. **Do not claim the migration works until tests/build verification is complete.**
14. **If an architectural issue is discovered, fix the smallest necessary scope rather than redesigning the application.**
15. **If existing S3 production data is discovered, stop short of destructive migration and report the required migration strategy separately.**

---

# 42. Final Deliverable

At completion, provide a concise implementation report containing:

```text
1. Files changed
2. Storage architecture before
3. Storage architecture after
4. Environment variables added/changed
5. Dependencies added/removed
6. Tests performed
7. Build/lint/typecheck results
8. R2 integration test result
9. Any existing S3 data that still requires migration
10. Any manual Cloudflare configuration required
11. Any remaining risks or follow-up tasks
```

The final implementation should leave Industrial Nexus using **Cloudflare R2 as its primary object storage provider while keeping the application's existing storage behavior and architecture intact wherever possible.**
