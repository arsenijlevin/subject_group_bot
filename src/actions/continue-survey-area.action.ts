import { Action } from "@abstract/actions.class";
import TYPES from "@container/types";
import { ActionsContext } from "@context/actions.context";
import { UserSessionData } from "@context/bot.context";
import { IQuestionService } from "@questions/questions.interface";
import { inject } from "inversify";
import { Markup } from "telegraf";

interface ContinueMessageData {
  continueSurveyIndex: number
}

export class ContinueSurveyAction extends Action {
  constructor(
    @inject(TYPES.IQuestionService) private readonly questionService: IQuestionService
  ) {
    super(/^{"continueSurveyIndex":.+?}+$/);
  }

  public async handle(ctx: ActionsContext): Promise<void> {
    if (!ctx.session?.id) return;

    const currentSession = ctx.session as UserSessionData;

    if (!currentSession.isPhoneVerified) return;

    if (currentSession.survey.isFinished) return;

    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch (error) {
      // suppress error while fast clicking on buttons
      return;
    }

    const response = JSON.parse(ctx.match.input) as ContinueMessageData;
    const continueSurveyIndex = response.continueSurveyIndex;
    const currentCompetenceArea = this.questionService.getCompetenceAreas()[continueSurveyIndex];

    let messageText = `<b>Сфера компетентности «${currentCompetenceArea.title.toUpperCase()}»</b>`;

    messageText += "\n\n<b>Элементы компетентности:</b>\n\n";

    messageText += this.getCompetenceAreaElements(continueSurveyIndex);

    messageText += `\n\nПродолжить 👇`;

    await ctx.reply(messageText, {
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback(`Продолжить`, `{"startAreaIndex":${continueSurveyIndex}}`),
      ]).reply_markup,
      parse_mode: "HTML",
    });

  }

  private getCompetenceAreaElements(competenceAreaIndex: number) : string {
    return this.questionService.getCompetenceAreas()[competenceAreaIndex].sections.map(section => `${section.sectionName}`).join("\n");
  }
}