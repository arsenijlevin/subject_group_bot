import { injectable } from "inversify";
import { Context } from "telegraf";
import { Message, Update } from "typegram";

@injectable()
export abstract class Trigger {
  constructor(
    public triggerText: ((update: Update) => update is Update.MessageUpdate<Record<"text", unknown> & Message.TextMessage>) | "message"
  ) { }

  public abstract handle(ctx: Context): void;
}