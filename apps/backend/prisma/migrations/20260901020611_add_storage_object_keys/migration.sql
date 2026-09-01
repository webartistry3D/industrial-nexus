-- AlterTable
ALTER TABLE "kyc_documents" ADD COLUMN     "file_key" TEXT,
ALTER COLUMN "file_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pods" ADD COLUMN     "image_key" TEXT,
ADD COLUMN     "signature_key" TEXT,
ALTER COLUMN "image_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_image_key" TEXT;

-- AlterTable
ALTER TABLE "vehicle_documents" ADD COLUMN     "file_key" TEXT,
ALTER COLUMN "file_url" DROP NOT NULL;
