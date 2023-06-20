import { NarrowedContext } from "telegraf";
import { Update, Message } from "typegram";
import { IBotContext } from "./bot.context";

export type MessagesContext = NarrowedContext<IBotContext, Update.MessageUpdate<Record<"text", unknown> & Message.TextMessage & Message.ContactMessage>>