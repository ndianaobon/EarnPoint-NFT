import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { apiError, parseBody } from "../common/errors.js";
import { authLimit } from "./auth.controller.js";
import { AuthService, publicUser } from "./auth.service.js";
import { codeSchema, disableTwoFactorSchema, passwordSchema, uuidSchema } from "./schemas.js";
import { SessionGuard, type AuthedRequest } from "./session.guard.js";

@Controller("me")
@UseGuards(SessionGuard)
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  async me(@Req() request: AuthedRequest) {
    const user = await this.auth.findById(request.auth.userId);
    if (!user) throw apiError(401, "UNAUTHENTICATED", "Please log in.");
    return publicUser(user);
  }

  @Get("sessions")
  async sessions(@Req() request: AuthedRequest) {
    const sessions = await this.auth.listSessions(request.auth.userId);
    return sessions.map((session) => ({
      ...session,
      current: session.id === request.auth.sessionId,
    }));
  }

  @Delete("sessions/:id")
  @HttpCode(200)
  async revokeSession(@Req() request: AuthedRequest, @Param("id") id: string) {
    if (!uuidSchema.safeParse(id).success) throw apiError(404, "NOT_FOUND", "That session wasn't found.");
    await this.auth.revokeSession(request.auth.userId, id);
    return { ok: true };
  }

  @Get("login-history")
  loginHistory(@Req() request: AuthedRequest) {
    return this.auth.loginHistory(request.auth.userId);
  }

  @Post("2fa/setup")
  @HttpCode(200)
  @Throttle(authLimit)
  twoFactorSetup(@Req() request: AuthedRequest, @Body() body: unknown) {
    return this.auth.beginTwoFactorSetup(request.auth.userId, parseBody(passwordSchema, body).password);
  }

  @Post("2fa/enable")
  @HttpCode(200)
  @Throttle(authLimit)
  twoFactorEnable(@Req() request: AuthedRequest, @Body() body: unknown) {
    return this.auth.enableTwoFactor(request.auth.userId, parseBody(codeSchema, body).code);
  }

  @Post("2fa/disable")
  @HttpCode(200)
  @Throttle(authLimit)
  async twoFactorDisable(@Req() request: AuthedRequest, @Body() body: unknown) {
    const { password, code } = parseBody(disableTwoFactorSchema, body);
    await this.auth.disableTwoFactor(request.auth.userId, password, code, request.auth.sessionId);
    return { ok: true };
  }
}
