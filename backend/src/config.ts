import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.url(),
  ALLOWED_ORIGINS: z.string().min(1),
  APP_ENCRYPTION_KEY: z
    .string()
    .refine((key) => Buffer.from(key, "base64").length === 32, "must be 32 bytes, base64 encoded"),
  TRUST_PROXY: z.string().default("loopback"),
});

export type AppConfig = {
  isProduction: boolean;
  isTest: boolean;
  port: number;
  databaseUrl: string;
  appUrl: string;
  allowedOrigins: string[];
  encryptionKey: Buffer;
  trustProxy: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration: ${z.prettifyError(parsed.error)}`);
  }
  const values = parsed.data;

  // Verification and reset emails only reach the console so far. Starting in
  // production would silently lock every new user out, so refuse instead.
  if (values.NODE_ENV === "production") {
    throw new Error("No email provider is configured, so production mode can't start yet.");
  }

  return {
    isProduction: false,
    isTest: values.NODE_ENV === "test",
    port: values.PORT,
    databaseUrl: values.DATABASE_URL,
    appUrl: values.APP_URL.replace(/\/$/, ""),
    allowedOrigins: values.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
    encryptionKey: Buffer.from(values.APP_ENCRYPTION_KEY, "base64"),
    trustProxy: values.TRUST_PROXY,
  };
}

export const CONFIG = Symbol("CONFIG");
