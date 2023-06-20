import { Action } from "@abstract/actions.class";
import TYPES from "@container/types";
import { ActionsContext } from "@context/actions.context";
import { UserSessionData } from "@context/bot.context";
import { IQuestionService } from "@questions/questions.interface";
import { inject } from "inversify";
import { Messages } from "../messages";
import { DateTime } from "luxon"; 

export class StartSurveyAction extends Action {
  constructor(
    @inject(TYPES.IQuestionService) private readonly questionService: IQuestionService,
    @inject(TYPES.Messages) private readonly messages: Messages
  ) {
    super("start_survey");
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


    currentSession.survey.isOngoing = true;
    currentSession.survey.startTime = DateTime.now().toISO() || "";

    currentSession.survey.current.questionIndex = 0;

    const formattedQuestion = this.questionService.getFormattedQuestion(0);

    await this.messages.replyWithSurveyButtons(ctx, formattedQuestion);    
  }
}