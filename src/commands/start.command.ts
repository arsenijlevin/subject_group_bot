import { CommandsContext } from "@context/commands.context";
import { Command } from "@abstract/command.class";
import { inject, injectable } from "inversify";
import { AdminSessionData, SessionData, UserSessionData } from "@context/bot.context";
import TYPES from "@container/types";
import { ISession } from "@session/session.interface";
import { Markup } from "telegraf";

@injectable()
export class StartCommand extends Command {
  constructor(
    @inject(TYPES.ISession) private readonly session: ISession
  ) {
    super("start");
  }

  public async handle(ctx: CommandsContext): Promise<void> {
    if (!ctx.session?.id) {
      ctx.session = {} as SessionData;
      ctx.session.id = ctx.from.id;
    } else {
      return;
    }

    if (this.session.isAdmin(ctx.session)) {
      ctx.session = {
        ...ctx.session,
        addedPhones: [],
      } as AdminSessionData;

      await this.handleAdminStart(ctx);
    } else {
      ctx.session = {
        ...ctx.session,
        isPhoneVerified: false,
        isEnteringPhone: false,
        isEnteringFullName: false,
        fullName: "",
        processingAnswer: false,
        nickname: "",
        phoneNumber: "",
        survey: {
          isOngoing: false,
          isFinished: false,
          startTime: "",
          endTime: "",
          results: [],
          current: {
            competenceAreaIndex: 0,
            questionIndex: 0,
            sectionIndex: 0,
          }, 
        },
      } as UserSessionData;

      await this.handleUserStart(ctx);
    }
  }

  private async handleUserStart(ctx: CommandsContext): Promise<void> {
    await ctx.reply("Для продолжения Вам необходимо поделиться контактом", Markup.keyboard([
      Markup.button.contactRequest("Поделиться контактом"),
    ]).resize());
  }

  private async handleAdminStart(ctx: CommandsContext): Promise<void> {
    await ctx.reply("Вы вошли как администратор. Введите номер телефона, которому необходимо предоставить доступ.");
  }
}