import { Inject, Injectable, Logger } from "@nestjs/common";
import { CONFIG, type AppConfig } from "../config.js";

export type Email = { to: string; subject: string; text: string };

// Development stand-in: prints emails to the console so links can be used locally.
// A real provider must replace this before launch, and loadConfig refuses to start in
// production until then.
@Injectable()
export class Mailer {
  private readonly logger = new Logger("Mailer");
  readonly sent: Email[] = [];

  constructor(@Inject(CONFIG) private readonly config: AppConfig) {}

  async send(email: Email) {
    if (this.config.isTest) {
      this.sent.push(email);
      return;
    }
    this.logger.log(`\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
  }
}
