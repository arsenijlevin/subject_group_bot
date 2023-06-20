import { NarrowedContext } from "telegraf";
import { Update, Message } from "typegram";
import { IBotContext } from "./bot.context";

export type CommandsContext = NarrowedContext<IBotContext, {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
}>