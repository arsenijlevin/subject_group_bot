import { Message } from "@abstract/triggers/message.class";
import TYPES from "@container/types";
import { MessagesContext } from "@context/message.context";
import { inject } from "inversify";
import { UserSessionData } from "@context/bot.context";
import * as PhoneNumberLib from "google-libphonenumber";
import { Messages } from "src/messages";
import { IResultStorageService } from "src/result-storage/result-storage.interface";

export const phoneNumberUtil = PhoneNumberLib.PhoneNumberUtil.getInstance();

export class EnteringFullName extends Message {
  constructor(
    @inject(TYPES.Messages) private readonly messages: Messages,
    @inject(TYPES.IResultStorageService) private readonly resultStorageService: IResultStorageService
  ) {
    super();
  }

  public async handle(ctx: MessagesContext): Promise<void> {
    if (!ctx.session?.id) return;

    const currentSession = ctx.session as UserSessionData;

    if (!currentSession.isEnteringFullName) return;

    const text = ctx.message.text;

    if (!text) return;
    
    currentSession.fullName = text;

    currentSession.isEnteringFullName = false;
    
    currentSession.nickname = ctx.from.username || "";

    await this.messages.replyWithUserGreetingMessage(ctx);
    await this.resultStorageService.save(ctx.session as UserSessionData);

    currentSession.isPhoneVerified = true;
  }
}