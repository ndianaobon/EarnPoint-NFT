import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { apiError } from "../common/errors.js";
import { Db } from "../db/db.service.js";
import { hashToken } from "./crypto.js";

export const SESSION_COOKIE = "ep_session";

export type AuthedRequest = Request & { auth: { userId: string; sessionId: string } };

export function readCookie(request: Request, name: string) {
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator !== -1 && part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return undefined;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly db: Db) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = readCookie(request, SESSION_COOKIE);
    if (!token) throw apiError(401, "UNAUTHENTICATED", "Please log in.");

    const { rows } = await this.db.query<{ id: string; user_id: string; stale: boolean }>(
      `SELECT s.id, s.user_id, s.last_seen_at < now() - interval '5 minutes' AS stale
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'active'`,
      [hashToken(token)],
    );
    const session = rows[0];
    if (!session) throw apiError(401, "UNAUTHENTICATED", "Please log in.");

    if (session.stale) {
      await this.db.query("UPDATE sessions SET last_seen_at = now() WHERE id = $1", [session.id]);
    }
    request.auth = { userId: session.user_id, sessionId: session.id };
    return true;
  }
}
