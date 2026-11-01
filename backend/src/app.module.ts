import { Controller, Get, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth/auth.controller.js";
import { AuthService } from "./auth/auth.service.js";
import { Mailer } from "./auth/mailer.js";
import { MeController } from "./auth/me.controller.js";
import { SessionGuard } from "./auth/session.guard.js";
import { CONFIG, loadConfig } from "./config.js";
import { Db } from "./db/db.service.js";

@Controller("health")
@SkipThrottle()
class HealthController {
  constructor(private readonly db: Db) {}

  @Get()
  async health() {
    await this.db.query("SELECT 1");
    return { status: "ok" };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: () => Number(process.env.GLOBAL_RATE_LIMIT ?? 300) },
    ]),
  ],
  controllers: [HealthController, AuthController, MeController],
  providers: [
    { provide: CONFIG, useFactory: () => loadConfig() },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    Db,
    Mailer,
    AuthService,
    SessionGuard,
  ],
})
export class AppModule {}
