import { CommandsContext } from "@context/commands.context";
import { Command } from "@abstract/command.class";
import { inject, injectable } from "inversify";
import TYPES from "@container/types";
import { ISession } from "@session/session.interface";
import { Markup } from "telegraf";

@injectable()
export class RestartCommand extends Command {
  constructor(
    @inject(TYPES.ISession) private readonly session: ISession
  ) {
    super("restart");
  }

  public async handle(ctx: CommandsContext): Promise<void> {
    if (!ctx.session?.id) return;

    if (this.session.isAdmin(ctx.session)) return;

    ctx.session = undefined;
    await ctx.reply("Бот перезапущен!\n\n<b>/start</b> - начать взаимодействие с ботом.", {
      reply_markup: Markup.removeKeyboard().reply_markup,
      parse_mode: "HTML",
    });
  }
}