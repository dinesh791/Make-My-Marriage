import { S3Client } from "@aws-sdk/client-s3";
import { getR2Env } from "@/lib/env/env";

let client: S3Client | undefined;
export function getR2Client() {
  if (client) return client;
  const config = getR2Env();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}
export function getR2BucketName() {
  return getR2Env().R2_BUCKET_NAME;
}
