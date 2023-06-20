import { IConfigService } from "@config/config.interface";
import TYPES from "@container/types";
import { ActionsContext } from "@context/actions.context";
import { MessagesContext } from "@context/message.context";
import { inject, injectable } from "inversify";
import { Context, MiddlewareFn } from "telegraf";
import LocalSessionTelegraf from "telegraf-session-local";
import { AdminSessionData, PhoneAccess, SessionData, UserSessionData } from "../../context/bot.context";
import { ISession } from "../session.interface";

@injectable()
export class LocalSession implements ISession {
  private session: LocalSessionTelegraf<SessionData>;
      
  constructor(
    @inject(TYPES.IConfigService) private readonly configService: IConfigService
  ) {
    this.session = new LocalSessionTelegraf({
      database: "sessions.json",
    });
  }

  public setAddedPhones(addedPhones: PhoneAccess[]): void {
    const adminSession = this.getAdminSession();

    if (!adminSession) return;
    if (!adminSession.addedPhones) return;

    adminSession.addedPhones = addedPhones;
  }

  public getMiddleware(): MiddlewareFn<Context> {
    return this.session.middleware();
  }

  public getSessionKey(ctx: Context): string {
    return this.session.getSessionKey(ctx);
  }

  public getSessionByCtx(ctx: Context): SessionData {
    return this.session.getSession(this.getSessionKey(ctx));
  }

  public isAdmin(sessionData : SessionData): boolean {
    return sessionData.id.toString() === this.configService.getAdmin();
  }

  public getAdminSession(): AdminSessionData | undefined {
    const admin = this.configService.getAdmin();
    return this.session.getSession(`${admin}:${admin}`);
  }

  public isPhoneExpired(phoneNumber: string): boolean {
    const adminSession = this.getAdminSession();

    if (!adminSession || !adminSession.addedPhones || !phoneNumber) return true;

    const isPhoneNumberAdded = adminSession.addedPhones.find(phone => phone.phoneNumber === phoneNumber);

    return !isPhoneNumberAdded;
  }

  public isUserAccessDenied(ctx: MessagesContext | ActionsContext): boolean {
    if (!ctx.session || !ctx.session.id) return true;

    if (!this.isAdmin(ctx.session)) {
      const currentSession = ctx.session as UserSessionData;

      if (currentSession.phoneNumber && this.isPhoneExpired(currentSession.phoneNumber)) {
        return true;
      }
    }

    return false;
  }
}