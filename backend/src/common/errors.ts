import { HttpException } from "@nestjs/common";
import type { z } from "zod";

export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return new HttpException({ code, message, fields }, status);
}

export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "body";
    fields[key] ??= issue.message;
  }
  throw apiError(400, "VALIDATION_FAILED", "Please check the details you entered.", fields);
}

export function isUniqueViolation(error: unknown): error is { constraint?: string } {
  return (error as { code?: string })?.code === "23505";
}
