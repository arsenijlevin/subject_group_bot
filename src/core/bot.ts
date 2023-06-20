import { Telegraf } from "telegraf";
import { Command } from "@abstract/command.class";
import { IConfigService } from "@config/config.interface";
import { IBotContext } from "@context/bot.context";
import { Action } from "@abstract/actions.class";
import { inject, injectable, multiInject } from "inversify";
import TYPES from "./container/types";
import { Trigger } from "@abstract/trigger.class";
import { ISession } from "./session/session.interface";
import { ITimeoutService } from "@timeout/timeout.interface";

@injectable()
export class Bot {
  private bot: Telegraf<IBotContext>;

  constructor(
    @inject(TYPES.IConfigService) private readonly configService: IConfigService,
    @inject(TYPES.ITimeoutService) private readonly timeoutService: ITimeoutService,
    @inject(TYPES.ISession) private readonly session: ISession,
    @multiInject(TYPES.Action) private readonly actions: Action[],
    @multiInject(TYPES.Command) private readonly commands: Command[],
    @multiInject(TYPES.Trigger) private readonly triggers: Trigger[]
  ) {
    this.bot = new Telegraf<IBotContext>(this.configService.getBotToken());
    this.bot.use(this.session.getMiddleware());
  }

  public async start(): Promise<void> {
    this.initCommands();
    this.initActions();
    this.initOnTriggers();

    console.log(`${this.commands.length} commands initialized!`);
    console.log(`${this.actions.length} actions initialized!`);
    console.log(`${this.triggers.length} triggers ( .on(...) actions ) initialized!`);

    console.log(`${this.configService.getAdmin()} set as Admin from .env!`);
    console.log(`${this.session.getAdminSession()?.id || "None"} have found as Admin session!`);

    /**
     * Bot.launch does not resolve a promise. 
     * .then(...) or `await` won't work. 
     * https://github.com/telegraf/telegraf/issues/1749#issuecomment-1326816944
     */
    void this.bot.launch();

    await this.printBotStatus();
    
    this.timeoutService.refreshTimeouts();
  }

  private initCommands(): void {
    for (const command of this.commands) {
      this.bot.command(command.triggerText, (ctx) => command.handle(ctx));
    }
  }

  private initActions(): void {
    for (const action of this.actions) {
      this.bot.action(action.triggerText, async (ctx) => {
        if (this.session.isUserAccessDenied(ctx)) {
          await ctx.reply("❌ Отсутствует доступ!");
          void ctx.answerCbQuery();
          return;
        }
        await ctx.answerCbQuery();
        await action.handle(ctx);
        
      });
    }
  }

  private initOnTriggers(): void {
    for (const trigger of this.triggers) {
      this.bot.on(trigger.triggerText, (ctx) => trigger.handle(ctx));
    }
  }

  private async printBotStatus(): Promise<void> {
    const isBotStarted = await this.isBotStarted();

    if (isBotStarted) {
      console.log("Bot started!");
    } else {
      console.error("Bot failed to start!");
    }
  }

  private async isBotStarted(): Promise<boolean> {
    const getMe = await this.bot.telegram.getMe();

    return !!getMe;
  }
}