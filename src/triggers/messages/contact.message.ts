import { Message } from "@abstract/triggers/message.class";
import TYPES from "@container/types";
import { UserSessionData } from "@context/bot.context";
import { MessagesContext } from "@context/message.context";
import { ISession } from "@session/session.interface";
import { phoneNumberUtil } from "@triggers/messages/admin.message";
import { inject } from "inversify";
import { Messages } from "src/messages";
import { IResultStorageService } from "src/result-storage/result-storage.interface";

export class ContactMessage extends Message {
  constructor(
    @inject(TYPES.ISession) private readonly session : ISession,
    @inject(TYPES.Messages) private readonly messages: Messages,
    @inject(TYPES.IResultStorageService) private readonly resultStorageService: IResultStorageService
  ) {
    super();
  }

  public async handle(ctx: MessagesContext): Promise<void> {
    if (!ctx.message.contact) return;

    if (!ctx.session?.id) return;
    
    const adminSession = this.session.getAdminSession();
    const currentSession = ctx.session as UserSessionData;
    if (!adminSession) return;

    if (!adminSession.addedPhones) return;
    
    if (!ctx.message.contact.phone_number) return;
    
    let rawPhoneNumber = ctx.message.contact.phone_number;

    if (!ctx.message.contact.phone_number.startsWith("+")) {
      rawPhoneNumber = `+${ctx.message.contact.phone_number}`;
    }

    const phoneNumber = phoneNumberUtil.parse(rawPhoneNumber);
    const phoneNumberText = `+${phoneNumber.getCountryCodeOrDefault()}${phoneNumber.getNationalNumberOrDefault()}`;

    if (adminSession.addedPhones.map(phone => phone.phoneNumber).includes(phoneNumberText)) {
      await this.messages.replyWithEnterFullName(ctx);
      
      currentSession.isEnteringFullName = true;
      currentSession.phoneNumber = phoneNumberText;

      await this.resultStorageService.increaseCapacity(1);
      await this.resultStorageService.loadStorage();
      await this.resultStorageService.save(ctx.session as UserSessionData);
    } else {
      await this.messages.replyWithEnterPhoneNumber(ctx);
      currentSession.isEnteringPhone = true;
    }

  }
}