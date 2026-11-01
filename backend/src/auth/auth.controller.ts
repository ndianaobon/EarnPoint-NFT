import { Body, Controller, HttpCode, Inject, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { CONFIG, type AppConfig } from "../config.js";
import { parseBody } from "../common/errors.js";
import { AuthService, type RequestContext } from "./auth.service.js";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
  twoFactorLoginSchema,
} from "./schemas.js";
import { SESSION_COOKIE, SessionGuard, type AuthedRequest } from "./session.guard.js";

export const authLimit = {
  default: { ttl: 60_000, limit: () => Number(process.env.AUTH_RATE_LIMIT ?? 10) },
};

export const contextOf = (request: Request): RequestContext => ({
  ip: request.ip,
  userAgent: request.headers["user-agent"],
});

@Controller("auth")
@Throttle(authLimit)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  @Post("register")
  register(@Body() body: unknown) {
    return this.auth.register(parseBody(registerSchema, body));
  }

  @Post("verify-email")
  @HttpCode(200)
  async verifyEmail(@Body() body: unknown) {
    await this.auth.verifyEmail(parseBody(tokenSchema, body).token);
    return { ok: true };
  }

  @Post("resend-verification")
  @HttpCode(200)
  async resendVerification(@Body() body: unknown) {
    await this.auth.resendVerification(parseBody(emailSchema, body).email);
    return { ok: true };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = parseBody(loginSchema, body);
    const result = await this.auth.login(email, password, contextOf(request));
    if (result.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: result.challengeToken };
    }
    this.setSessionCookie(response, result.sessionToken, result.maxAgeMs);
    return { twoFactorRequired: false, user: result.user };
  }

  @Post("login/2fa")
  @HttpCode(200)
  async loginTwoFactor(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { challengeToken, code } = parseBody(twoFactorLoginSchema, body);
    const session = await this.auth.completeTwoFactorLogin(challengeToken, code, contextOf(request));
    this.setSessionCookie(response, session.sessionToken, session.maxAgeMs);
    return { user: session.user };
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async logout(@Req() request: AuthedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.auth.sessionId);
    response.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  }

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() body: unknown) {
    await this.auth.forgotPassword(parseBody(emailSchema, body).email);
    return { ok: true };
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() body: unknown) {
    const { token, password } = parseBody(resetPasswordSchema, body);
    await this.auth.resetPassword(token, password);
    return { ok: true };
  }

  private setSessionCookie(response: Response, token: string, maxAge: number) {
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.config.isProduction,
      path: "/",
      maxAge,
    });
  }
}
