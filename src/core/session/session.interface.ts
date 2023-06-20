import { ActionsContext } from "@context/actions.context";
import { MessagesContext } from "@context/message.context";
import { MiddlewareFn, Context } from "telegraf";
import { AdminSessionData, PhoneAccess, SessionData } from "../context/bot.context";

export interface ISession {
  getSessionByCtx(ctx: Context): SessionData,
  getSessionKey(ctx: Context): string,
  getMiddleware(): MiddlewareFn<Context>,
  getAdminSession(): AdminSessionData | undefined,
  isAdmin(sessionData : SessionData): boolean,
  setAddedPhones(addedPhones : PhoneAccess[]) : void,
  isPhoneExpired(phoneNumber : string) : boolean,
  isUserAccessDenied(ctx: MessagesContext | ActionsContext) : boolean
}