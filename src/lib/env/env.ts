import { z } from "zod";

const baseSchema = z.object({ NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000") });
const databaseSchema = baseSchema.extend({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
});
const authSchema = baseSchema.extend({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters."),
});
const googleSchema = baseSchema.extend({
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required."),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required."),
});
const r2Schema = baseSchema.extend({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.url(),
});
const emailSchema = baseSchema.extend({
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
});

function parseEnvironment<T extends z.ZodType>(schema: T): z.output<T> {
  const result = schema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => issue.message).join(" ")}`,
    );
  return result.data;
}

export const getDatabaseEnv = () => parseEnvironment(databaseSchema);
export const getAuthEnv = () => parseEnvironment(authSchema);
export const getGoogleEnv = () => parseEnvironment(googleSchema);
export const getR2Env = () => parseEnvironment(r2Schema);
export const getEmailEnv = () => parseEnvironment(emailSchema);
