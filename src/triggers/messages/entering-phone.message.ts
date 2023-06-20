import { Message } from "@abstract/triggers/message.class";
import TYPES from "@container/types";
import { MessagesContext } from "@context/message.context";
import { inject } from "inversify";
import { UserSessionData } from "@context/bot.context";
import * as PhoneNumberLib from "google-libphonenumber";
import { ISession } from "@session/session.interface";
import { Messages } from "src/messages";
import { IResultStorageService } from "src/result-storage/result-storage.interface";

export const phoneNumberUtil = PhoneNumberLib.PhoneNumberUtil.getInstance();

export class EnteringPhoneMessage extends Message {
  constructor(
    @inject(TYPES.ISession) private readonly session: ISession,
    @inject(TYPES.Messages) private readonly messages: Messages,
    @inject(TYPES.IResultStorageService) private readonly resultStorageService: IResultStorageService
  ) {
    super();
  }

  public async handle(ctx: MessagesContext): Promise<void> {
    if (!ctx.session?.id) return;

    const adminSession = this.session.getAdminSession();
    const currentSession = ctx.session as UserSessionData;
    
    if (!adminSession || !adminSession.addedPhones) return;
    if (!currentSession.isEnteringPhone) return;

    const text = ctx.message.text;

    if (!text) return;

    if (!text.startsWith("+")) {
      await ctx.reply("Некорректный номер телефона.\nТелефонный номер должен начинаться с '+'.\nНапример: +79123456789 или +375 29 511 33 22");
      return;
    }
    try {
      const phoneNumber = phoneNumberUtil.parse(text);

      const phoneNumberText = `+${phoneNumber.getCountryCodeOrDefault()}${phoneNumber.getNationalNumberOrDefault()}`;

      if (adminSession.addedPhones.map(phone => phone.phoneNumber).includes(phoneNumberText)) {
        await this.messages.replyWithEnterFullName(ctx);
        
        currentSession.isEnteringPhone = false;
        currentSession.isEnteringFullName = true;
        currentSession.phoneNumber = phoneNumberText;

        await this.resultStorageService.increaseCapacity(1);
        await this.resultStorageService.loadStorage();
        await this.resultStorageService.save(ctx.session as UserSessionData);
      } else {
        await this.messages.replyWithEnterPhoneNumber(ctx);
      }
    } catch (err) {
      await ctx.reply("Некорректный номер телефона.");
    }
  }
}