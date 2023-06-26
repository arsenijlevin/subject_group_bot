import { ActionsContext } from "@context/actions.context";
import { MessagesContext } from "@context/message.context";
import { injectable } from "inversify";
import { Markup } from "telegraf";

export const enum Answers {
  NO = -1,
  YES = 1
}

@injectable()
export class Messages {
  public async replyWithEnterFullName(ctx: MessagesContext): Promise<void> {
    await ctx.reply(`Пожалуйста укажите ваше имя и фамилию и нажмите кнопку "Отправить"`, Markup.removeKeyboard());

  }

  public async replyWithEnterPhoneNumber(ctx: MessagesContext): Promise<void> {
    await ctx.reply(`Совпадения не найдены, напишите ваш номер телефона в следующем формате: +79999999999 и нажмите кнопку "Отправить"`,
      Markup.removeKeyboard()
    );
  }

  public async replyWithUserGreetingMessage(ctx: MessagesContext): Promise<void> {
    await ctx.reply(`Добро пожаловать в тест на диагностику процессов управления проектами в вашей организации!

За счёт определения простых ежедневных ваших действий в управлении проектами мы сможем определить признаки применения 39 процессов управления проектами согласно стандарта ISO 21500. 

Тест состоит из 85 вопросов.  
Вопросы сгруппированы по предметным областям и процессам управления проектами - их названия будут указаны жирным шрифтом. 
От вас потребуется нажатие кнопки с ответом «Да» или «Нет». Можно делать перерывы в работе, все ответы сохранятся, главное - уложиться в общее назначенное время`, {
      parse_mode: "HTML", reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("Продолжить", `start_survey`),
        ],
      ]).reply_markup,
    });
  }

  public async replyWithSurveyButtons(ctx: ActionsContext, question: string): Promise<void> {
    await ctx.reply(question, {
      reply_markup: Markup.inlineKeyboard(
        [
          Markup.button.callback("Да", `{"answer":${Answers.YES}}`),
          Markup.button.callback("Нет", `{"answer":${Answers.NO}}`),
        ]).reply_markup,
      parse_mode: "HTML",
    });
  }

  public async replyWithClosingMessage(ctx: ActionsContext): Promise<void> {
    await ctx.reply(`К сожалению все вопросы в тесте закончились 😩
НО, приятности в том, что ваши ответы повлияют на состав рекомендаций и этапов внедрения процессов управления проектами, а также развитие компетенций сотрудников. 

Благодарим вас за проделанную работу ✊`, {
      parse_mode: "HTML",
    });
  }
}