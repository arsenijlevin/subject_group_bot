import { Trigger } from "@abstract/trigger.class";
import { MessagesContext } from "@context/message.context";
import { inject, injectable, multiInject } from "inversify";
import TYPES from "@container/types";
import { Message } from "@abstract/triggers/message.class";
import { ISession } from "@session/session.interface";


@injectable()
export class MessageTrigger extends Trigger {
  constructor(
    @multiInject(TYPES.Message) private readonly messages: Message[],
    @inject(TYPES.ISession) private readonly session: ISession
  ) {
    super("message");
    console.log(`${this.messages.length} messages initialized!`);
  }

  public async handle(ctx: MessagesContext): Promise<void> {
    if (ctx.from.is_bot) return;

    if (this.session.isUserAccessDenied(ctx)) {
      await ctx.reply("❌ Отсутствует доступ!");
      return;
    }

    await Promise.all(this.messages.map(async (message) => {
      await message.handle(ctx);
    }));
  }
}