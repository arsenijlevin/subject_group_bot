import { NarrowedContext } from "telegraf";
import { Update, CallbackQuery } from "typegram";
import { IBotContext } from "./bot.context";

export type ActionsContext = NarrowedContext<IBotContext & {
    match: RegExpExecArray;
}, Update.CallbackQueryUpdate<CallbackQuery>>