import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("Enter a valid email address."));

const newPassword = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "Use 200 characters or fewer.");

const phone = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(
    z.string().regex(/^\+[1-9][0-9]{6,14}$/, "Enter your phone number with its country code, like +1 555 010 0000."),
  );

const token = z.string().min(20).max(200);

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, "Use 3 to 20 letters, numbers or underscores."),
  phone,
  email,
  password: newPassword,
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.string().regex(/^[A-Z0-9]{4,20}$/, "Use 4 to 20 letters or numbers.").optional()),
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(200) });
export const twoFactorLoginSchema = z.object({
  challengeToken: token,
  code: z.string().trim().min(6).max(20),
});
export const tokenSchema = z.object({ token });
export const emailSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token, password: newPassword });
export const passwordSchema = z.object({ password: z.string().min(1).max(200) });
export const codeSchema = z.object({ code: z.string().trim().min(6).max(6) });
export const disableTwoFactorSchema = z.object({
  password: z.string().min(1).max(200),
  code: z.string().trim().min(6).max(20),
});
export const uuidSchema = z.uuid();
