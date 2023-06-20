import { ActionsContext } from "@context/actions.context";
import { MessagesContext } from "@context/message.context";
import { injectable } from "inversify";
import { Markup } from "telegraf";

@injectable()
export class Messages {
  public async replyWithEnterFullName(ctx: MessagesContext): Promise<void> {
    await ctx.reply("Данный телефон найден! Введите ФИО", Markup.removeKeyboard());

  }

  public async replyWithEnterPhoneNumber(ctx: MessagesContext): Promise<void> {
    await ctx.reply("Данный номер телефона не найден. Введите другой номер телефона для получения доступа.",
      Markup.removeKeyboard()
    );
  }

  public async replyWithUserGreetingMessage(ctx: MessagesContext): Promise<void> {
    await ctx.reply(`<b>Добро пожаловать на проверку своего уровня компетентности!

Перед вами тест по 28 элементам ICB 4.0

☝️ Данный тест позволит вам оценить свои компетенции руководителя проекта согласно требованиям стандарта IPMA 

Предлагается ответить на 140 вопросов. 

⏱ Обычно требуется не более 1 часа  

Каждый вопрос будет выведен отдельным сообщением, на который вы ответите нажатием одной из кнопок - от 1️⃣ до 5️⃣, 
где 1️⃣  означает почти полное отсутствие такого навыка, а 5️⃣ - сильно развитый навык.

После ответов на все вопросы вы получите рейтинг ваших компетенций и сможете заняться их развитием 📈

🚀 Выберите сферу компетентности и нажмите на нее, когда будете готовы  👇</b>`, {
      parse_mode: "HTML", reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("«КОНТЕКСТ»", `{"continueSurveyIndex":0}`),
          Markup.button.callback("«ЛЮДИ»", `{"continueSurveyIndex":1}`),
          Markup.button.callback("«ПРАКТИКА»", `{"continueSurveyIndex":2}`),
        ],
      ]).reply_markup,
    });
  }

  public async replyWithSurveyButtons(ctx: ActionsContext, question: string): Promise<void> {
    await ctx.reply(question, {
      reply_markup: Markup.inlineKeyboard(
        [
          Markup.button.callback("1", `{"answer":1}`),
          Markup.button.callback("2", `{"answer":2}`),
          Markup.button.callback("3", `{"answer":3}`),
          Markup.button.callback("4", `{"answer":4}`),
          Markup.button.callback("5", `{"answer":5}`),
        ]).reply_markup,
      parse_mode: "HTML",
    });
  }

  public async replyWithClosingMessage(ctx: ActionsContext): Promise<void> {
    await ctx.reply(`<b>Благодарю Вас за прохождение теста, надеюсь Вы получили ценную и полезную информацию о своих навыках ☝️

А для того чтобы ещё больше получать полезной информации предлагаю подписаться на ТК «Сообщество практиков проектного управления» 

https://t.me/CommunityProject</b>`, {
      parse_mode: "HTML",
    });
  }
}