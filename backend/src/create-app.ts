import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { CONFIG, type AppConfig } from "./config.js";

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === "test" ? false : undefined,
  });
  const config = app.get<AppConfig>(CONFIG);

  app.set("trust proxy", config.trustProxy);
  app.use(helmet());

  // Blocks other websites from using a visitor's login cookie. Requests with no Origin
  // come from non-browser clients, which don't carry that cookie automatically.
  app.use((request: Request, response: Response, next: NextFunction) => {
    const { origin } = request.headers;
    const isRead = request.method === "GET" || request.method === "HEAD";
    if (!isRead && origin && !config.allowedOrigins.includes(origin)) {
      response.status(403).json({ code: "ORIGIN_NOT_ALLOWED", message: "This origin isn't allowed." });
      return;
    }
    next();
  });

  app.setGlobalPrefix("api");
  return { app, config };
}
