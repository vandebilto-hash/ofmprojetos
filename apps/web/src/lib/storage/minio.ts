import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const storageClient = new S3Client({
  region: process.env.MINIO_REGION ?? "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? "projete",
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? "projete-secret"
  }
});

export const bucket = process.env.MINIO_BUCKET ?? "projete-se";

export async function createUploadUrl(path: string, contentType: string) {
  return getSignedUrl(
    storageClient,
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      ContentType: contentType
    }),
    { expiresIn: 300 }
  );
}

export async function createDownloadUrl(path: string) {
  return getSignedUrl(
    storageClient,
    new GetObjectCommand({
      Bucket: bucket,
      Key: path
    }),
    { expiresIn: 300 }
  );
}
