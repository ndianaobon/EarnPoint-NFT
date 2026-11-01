import { Inject, Injectable, Logger } from "@nestjs/common";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import QRCode from "qrcode";
import { CONFIG, type AppConfig } from "../config.js";
import { apiError, isUniqueViolation } from "../common/errors.js";
import { Db, type Queryable } from "../db/db.service.js";
import {
  decrypt,
  DUMMY_PASSWORD_HASH,
  encrypt,
  hashPassword,
  hashToken,
  newRecoveryCode,
  newReferralCode,
  newToken,
  normalizeRecoveryCode,
  verifyPassword,
} from "./crypto.js";
import { Mailer } from "./mailer.js";

export type RequestContext = { ip?: string; userAgent?: string };

type TokenPurpose = "email_verify" | "password_reset" | "mfa_challenge";

type UserRow = {
  id: string;
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  email_verified_at: Date | null;
  phone_verified_at: Date | null;
  status: "active" | "suspended" | "closed";
  role: string;
  referral_code: string;
  totp_secret_encrypted: string | null;
  totp_enabled_at: Date | null;
  totp_last_step: string | null;
  failed_login_count: number;
  locked_until: Date | null;
  created_at: Date;
};

const SESSION_DAYS = 14;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const MAX_MFA_ATTEMPTS = 5;
const RECOVERY_CODE_COUNT = 10;
const TOTP_PERIOD = 30;

const DUPLICATE_FIELDS: Record<string, [string, string]> = {
  users_username_unique: ["username", "This username is taken."],
  users_email_unique: ["email", "This email is already registered."],
  users_phone_unique: ["phone", "This phone number is already registered."],
};

const invalidCredentials = () =>
  apiError(401, "INVALID_CREDENTIALS", "Incorrect email or password, or the account is temporarily locked.");
const invalidCode = () => apiError(400, "INVALID_CODE", "That code isn't valid. Please try again.");
const invalidLink = () =>
  apiError(400, "INVALID_TOKEN", "This link is invalid or has expired. Please request a new one.");

export function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    emailVerified: !!user.email_verified_at,
    phoneVerified: !!user.phone_verified_at,
    referralCode: user.referral_code,
    twoFactorEnabled: !!user.totp_enabled_at,
    role: user.role,
    createdAt: user.created_at,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger("Auth");

  constructor(
    private readonly db: Db,
    private readonly mailer: Mailer,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  async register(input: {
    username: string;
    phone: string;
    email: string;
    password: string;
    referralCode?: string;
  }) {
    const passwordHash = await hashPassword(input.password);

    for (let attempt = 0; ; attempt++) {
      try {
        const { user, token } = await this.db.tx(async (tx) => {
          let referrerId: string | null = null;
          if (input.referralCode) {
            const { rows } = await tx.query<{ id: string }>(
              "SELECT id FROM users WHERE referral_code = $1 AND status = 'active'",
              [input.referralCode],
            );
            referrerId = rows[0]?.id ?? null;
            if (!referrerId) {
              throw apiError(400, "VALIDATION_FAILED", "Please check the details you entered.", {
                referralCode: "This referral code isn't valid.",
              });
            }
          }

          const { rows } = await tx.query<UserRow>(
            `INSERT INTO users (username, email, phone, password_hash, referral_code, referred_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [input.username, input.email, input.phone, passwordHash, newReferralCode(), referrerId],
          );
          const created = rows[0]!;
          if (referrerId) {
            await tx.query("INSERT INTO referrals (referrer_id, referee_id) VALUES ($1, $2)", [
              referrerId,
              created.id,
            ]);
          }
          const emailToken = await this.issueToken(tx, created.id, "email_verify", 24 * 60);
          return { user: created, token: emailToken };
        });

        await this.sendVerificationEmail(user.email, token);
        return { email: user.email };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const duplicate = DUPLICATE_FIELDS[error.constraint ?? ""];
        if (duplicate) {
          throw apiError(409, "ALREADY_REGISTERED", duplicate[1], { [duplicate[0]]: duplicate[1] });
        }
        // Only a random referral code collision is left, which a new code fixes.
        if (attempt >= 3) throw error;
      }
    }
  }

  async verifyEmail(token: string) {
    const userId = await this.consumeToken(this.db, token, "email_verify");
    if (!userId) throw invalidLink();
    await this.db.query(
      "UPDATE users SET email_verified_at = coalesce(email_verified_at, now()) WHERE id = $1",
      [userId],
    );
  }

  // Answers the same way whether or not the email is registered.
  async resendVerification(email: string) {
    const user = await this.findByEmail(email);
    if (!user || user.email_verified_at || user.status !== "active") return;
    await this.revokeTokens(user.id, "email_verify");
    const token = await this.issueToken(this.db, user.id, "email_verify", 24 * 60);
    await this.sendVerificationEmail(user.email, token);
  }

  async login(email: string, password: string, context: RequestContext) {
    const user = await this.findByEmail(email);
    if (!user) {
      await verifyPassword(password, await DUMMY_PASSWORD_HASH);
      await this.recordLogin(null, email, false, "unknown_email", context);
      throw invalidCredentials();
    }

    if (user.locked_until && user.locked_until > new Date()) {
      await this.recordLogin(user.id, email, false, "locked", context);
      throw invalidCredentials();
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      await this.db.query(
        `UPDATE users SET
           failed_login_count = CASE WHEN failed_login_count + 1 >= $2 THEN 0 ELSE failed_login_count + 1 END,
           locked_until = CASE WHEN failed_login_count + 1 >= $2
                               THEN now() + make_interval(mins => $3) ELSE locked_until END
         WHERE id = $1`,
        [user.id, MAX_FAILED_LOGINS, LOCK_MINUTES],
      );
      await this.recordLogin(user.id, email, false, "wrong_password", context);
      throw invalidCredentials();
    }

    await this.db.query(
      "UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1",
      [user.id],
    );

    if (user.status !== "active") {
      await this.recordLogin(user.id, email, false, `status_${user.status}`, context);
      throw apiError(403, "ACCOUNT_UNAVAILABLE", "This account isn't active. Please contact support.");
    }
    if (!user.email_verified_at) {
      await this.recordLogin(user.id, email, false, "email_unverified", context);
      throw apiError(403, "EMAIL_NOT_VERIFIED", "Please verify your email before logging in.");
    }

    if (user.totp_enabled_at) {
      await this.revokeTokens(user.id, "mfa_challenge");
      const challengeToken = await this.issueToken(this.db, user.id, "mfa_challenge", 5);
      return { twoFactorRequired: true as const, challengeToken };
    }

    await this.recordLogin(user.id, email, true, "password", context);
    return { twoFactorRequired: false as const, ...(await this.startSession(user, context)) };
  }

  async completeTwoFactorLogin(challengeToken: string, code: string, context: RequestContext) {
    const { rows } = await this.db.query<{ id: string; user_id: string; attempts: number }>(
      `UPDATE one_time_tokens SET attempts = attempts + 1
       WHERE token_hash = $1 AND purpose = 'mfa_challenge' AND used_at IS NULL
         AND expires_at > now() AND attempts < $2
       RETURNING id, user_id, attempts`,
      [hashToken(challengeToken), MAX_MFA_ATTEMPTS],
    );
    const challenge = rows[0];
    if (!challenge) throw apiError(400, "CHALLENGE_EXPIRED", "Please log in again.");

    const user = await this.findById(challenge.user_id);
    if (!user || user.status !== "active") throw apiError(400, "CHALLENGE_EXPIRED", "Please log in again.");

    const accepted = (await this.checkTotp(user, code)) || (await this.useRecoveryCode(user.id, code));
    if (!accepted) {
      await this.recordLogin(user.id, user.email, false, "wrong_2fa_code", context);
      throw invalidCode();
    }

    await this.db.query("UPDATE one_time_tokens SET used_at = now() WHERE id = $1", [challenge.id]);
    await this.recordLogin(user.id, user.email, true, "password_and_2fa", context);
    return this.startSession(user, context);
  }

  async logout(sessionId: string) {
    await this.db.query("UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL", [
      sessionId,
    ]);
  }

  // Answers the same way whether or not the email is registered.
  async forgotPassword(email: string) {
    const user = await this.findByEmail(email);
    if (!user || user.status !== "active") return;
    await this.revokeTokens(user.id, "password_reset");
    const token = await this.issueToken(this.db, user.id, "password_reset", 60);
    await this.mailer.send({
      to: user.email,
      subject: "Reset your Earn Point NFT password",
      text: `Use this link within one hour to choose a new password:\n${this.config.appUrl}/reset-password?token=${token}\n\nIf you didn't ask for this, you can ignore this email.`,
    });
  }

  async resetPassword(token: string, password: string) {
    const passwordHash = await hashPassword(password);
    const user = await this.db.tx(async (tx) => {
      const userId = await this.consumeToken(tx, token, "password_reset");
      if (!userId) throw invalidLink();
      const { rows } = await tx.query<UserRow>(
        `UPDATE users SET password_hash = $2, failed_login_count = 0, locked_until = NULL
         WHERE id = $1 RETURNING *`,
        [userId, passwordHash],
      );
      await tx.query("UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [
        userId,
      ]);
      return rows[0]!;
    });
    await this.securityNotice(user.email, "Your password was changed, and all devices were logged out.");
  }

  async findById(id: string) {
    const { rows } = await this.db.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ?? null;
  }

  async listSessions(userId: string) {
    const { rows } = await this.db.query(
      `SELECT id, ip, user_agent AS "userAgent", created_at AS "createdAt", last_seen_at AS "lastSeenAt"
       FROM sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
       ORDER BY last_seen_at DESC`,
      [userId],
    );
    return rows;
  }

  async revokeSession(userId: string, sessionId: string) {
    const { rowCount } = await this.db.query(
      "UPDATE sessions SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
      [sessionId, userId],
    );
    if (!rowCount) throw apiError(404, "NOT_FOUND", "That session wasn't found.");
  }

  async loginHistory(userId: string) {
    const { rows } = await this.db.query(
      `SELECT success, reason, ip, user_agent AS "userAgent", created_at AS "createdAt"
       FROM login_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId],
    );
    return rows;
  }

  async beginTwoFactorSetup(userId: string, password: string) {
    const user = await this.requireUser(userId);
    if (user.totp_enabled_at) throw apiError(409, "ALREADY_ENABLED", "Two-step verification is already on.");
    await this.requirePassword(user, password);

    const secret = generateSecret();
    await this.db.query("UPDATE users SET totp_secret_encrypted = $2 WHERE id = $1", [
      userId,
      encrypt(secret, this.config.encryptionKey),
    ]);
    const otpauthUrl = generateURI({ issuer: "Earn Point NFT", label: user.email, secret });
    return { secret, otpauthUrl, qrCode: await QRCode.toDataURL(otpauthUrl) };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.requireUser(userId);
    if (user.totp_enabled_at) throw apiError(409, "ALREADY_ENABLED", "Two-step verification is already on.");
    if (!user.totp_secret_encrypted) throw apiError(400, "SETUP_REQUIRED", "Please start the setup again.");
    if (!(await this.checkTotp(user, code))) throw invalidCode();

    const codes = Array.from({ length: RECOVERY_CODE_COUNT }, newRecoveryCode);
    await this.db.tx(async (tx) => {
      await tx.query("UPDATE users SET totp_enabled_at = now() WHERE id = $1", [userId]);
      await tx.query("DELETE FROM recovery_codes WHERE user_id = $1", [userId]);
      for (const recovery of codes) {
        await tx.query("INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)", [
          userId,
          hashToken(recovery),
        ]);
      }
    });
    await this.securityNotice(user.email, "Two-step verification was turned on for your account.");
    return { recoveryCodes: codes };
  }

  async disableTwoFactor(userId: string, password: string, code: string, currentSessionId: string) {
    const user = await this.requireUser(userId);
    if (!user.totp_enabled_at) throw apiError(409, "NOT_ENABLED", "Two-step verification is already off.");
    await this.requirePassword(user, password);
    const accepted = (await this.checkTotp(user, code)) || (await this.useRecoveryCode(userId, code));
    if (!accepted) throw invalidCode();

    await this.db.tx(async (tx) => {
      await tx.query(
        `UPDATE users SET totp_secret_encrypted = NULL, totp_enabled_at = NULL, totp_last_step = NULL
         WHERE id = $1`,
        [userId],
      );
      await tx.query("DELETE FROM recovery_codes WHERE user_id = $1", [userId]);
      await tx.query(
        "UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL",
        [userId, currentSessionId],
      );
    });
    await this.securityNotice(user.email, "Two-step verification was turned off for your account.");
  }

  private async requireUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw apiError(401, "UNAUTHENTICATED", "Please log in.");
    return user;
  }

  private async requirePassword(user: UserRow, password: string) {
    if (!(await verifyPassword(password, user.password_hash))) {
      throw apiError(400, "WRONG_PASSWORD", "That password isn't correct.", {
        password: "That password isn't correct.",
      });
    }
  }

  private async findByEmail(email: string) {
    const { rows } = await this.db.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    return rows[0] ?? null;
  }

  // A code can't be used twice, even within its 30-second window. The step only moves
  // forward, in a single atomic update, so two simultaneous requests can't both pass.
  private async checkTotp(user: UserRow, code: string) {
    if (!user.totp_secret_encrypted || !/^[0-9]{6}$/.test(code)) return false;
    const secret = decrypt(user.totp_secret_encrypted, this.config.encryptionKey);
    const result = await verifyTotp({
      secret,
      token: code,
      epochTolerance: TOTP_PERIOD,
      afterTimeStep: user.totp_last_step === null ? undefined : Number(user.totp_last_step),
    });
    if (!result.valid) return false;
    const step = Math.floor(Date.now() / 1000 / TOTP_PERIOD) + (result.delta ?? 0);
    const { rowCount } = await this.db.query(
      `UPDATE users SET totp_last_step = $2
       WHERE id = $1 AND (totp_last_step IS NULL OR totp_last_step < $2)`,
      [user.id, step],
    );
    return rowCount === 1;
  }

  private async useRecoveryCode(userId: string, code: string) {
    const { rowCount } = await this.db.query(
      `UPDATE recovery_codes SET used_at = now()
       WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`,
      [userId, hashToken(normalizeRecoveryCode(code))],
    );
    return rowCount === 1;
  }

  private async startSession(user: UserRow, context: RequestContext) {
    const token = newToken();
    await this.db.query(
      `INSERT INTO sessions (user_id, token_hash, ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, now() + make_interval(days => $5))`,
      [user.id, hashToken(token), context.ip ?? null, context.userAgent?.slice(0, 400) ?? null, SESSION_DAYS],
    );
    return { sessionToken: token, maxAgeMs: SESSION_DAYS * 24 * 60 * 60 * 1000, user: publicUser(user) };
  }

  private async issueToken(db: Queryable, userId: string, purpose: TokenPurpose, minutes: number) {
    const token = newToken();
    await db.query(
      `INSERT INTO one_time_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
      [userId, purpose, hashToken(token), minutes],
    );
    return token;
  }

  private async consumeToken(db: Queryable, token: string, purpose: TokenPurpose) {
    const { rows } = await db.query<{ user_id: string }>(
      `UPDATE one_time_tokens SET used_at = now()
       WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [hashToken(token), purpose],
    );
    return rows[0]?.user_id ?? null;
  }

  private revokeTokens(userId: string, purpose: TokenPurpose) {
    return this.db.query(
      "UPDATE one_time_tokens SET used_at = now() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL",
      [userId, purpose],
    );
  }

  private recordLogin(
    userId: string | null,
    email: string,
    success: boolean,
    reason: string,
    context: RequestContext,
  ) {
    return this.db.query(
      `INSERT INTO login_events (user_id, email, success, reason, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email, success, reason, context.ip ?? null, context.userAgent?.slice(0, 400) ?? null],
    );
  }

  private sendVerificationEmail(email: string, token: string) {
    return this.mailer.send({
      to: email,
      subject: "Verify your Earn Point NFT email",
      text: `Welcome! Use this link within 24 hours to verify your email:\n${this.config.appUrl}/verify-email?token=${token}`,
    });
  }

  private async securityNotice(email: string, message: string) {
    try {
      await this.mailer.send({
        to: email,
        subject: "Earn Point NFT security notice",
        text: `${message}\n\nIf this wasn't you, please contact support right away.`,
      });
    } catch (error) {
      // The change has already happened, so a mail failure mustn't report it as failed.
      this.logger.error(`Security notice failed: ${(error as Error).message}`);
    }
  }
}
