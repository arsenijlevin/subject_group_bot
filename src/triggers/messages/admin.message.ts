import { Message } from "@abstract/triggers/message.class";
import TYPES from "@container/types";
import { MessagesContext } from "@context/message.context";
import { inject } from "inversify";
import { AdminSessionData, PhoneAccess } from "@context/bot.context";
import * as PhoneNumberLib from "google-libphonenumber";
import { ISession } from "@session/session.interface";
import { DateTime } from "luxon";
import { ITimeoutService } from "@timeout/timeout.interface";

export const phoneNumberUtil = PhoneNumberLib.PhoneNumberUtil.getInstance();

export class AdminMessage extends Message {
  constructor(
    @inject(TYPES.ISession) private readonly session : ISession,
    @inject(TYPES.ITimeoutService) private readonly timeoutService: ITimeoutService
  ) {
    super();
  }

  public async handle(ctx: MessagesContext): Promise<void> {
    if (!ctx.session?.id) return;

    if (!this.session.isAdmin(ctx.session)) {
      return;
    }

    const endDateTime = DateTime.now().plus({ days: 1, }).toISO();

    if (!endDateTime) return;

    const text = ctx.message.text;

    if (!text) return;

    if (!text.startsWith("+")) {
      await ctx.reply("Некорректный номер телефона.\nТелефонный номер должен начинаться с '+'.\nНапример: +79123456789 или +375 29 511 33 22");
      return;
    }

    const session = ctx.session as AdminSessionData;

    try {
      const phoneNumber = phoneNumberUtil.parse(text);

      const isValidPhoneNumber = phoneNumberUtil.isValidNumber(phoneNumber);

      if (!isValidPhoneNumber) {
        throw new Error();
      }

      const phoneNumberText = `+${phoneNumber.getCountryCodeOrDefault()}${phoneNumber.getNationalNumberOrDefault()}`;

      if (!session.addedPhones) {
        session.addedPhones = [];
      }

      if (session.addedPhones.map(phone => phone.phoneNumber).includes(phoneNumberText)) {
        await ctx.reply("Данный телефонный номер был добавлен ранее.");
        return;
      }

      const addedPhone : PhoneAccess = {
        phoneNumber: phoneNumberText,
        accessEndDateTimeISO: endDateTime,
      };

      session.addedPhones.push(addedPhone);

      this.timeoutService.addPhoneExpireTimeout(addedPhone);

      await ctx.reply(`✅ Телефонный номер: <b>${phoneNumberText}</b> успешно добавлен!`, { parse_mode: "HTML", });

    } catch (err) {
      await ctx.reply("❌ Некорректный номер телефона.");
    }
  }
}