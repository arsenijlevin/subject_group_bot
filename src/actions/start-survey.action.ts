import { Action } from "@abstract/actions.class";
import TYPES from "@container/types";
import { ActionsContext } from "@context/actions.context";
import { UserSessionData } from "@context/bot.context";
import { IQuestionService } from "@questions/questions.interface";
import { inject } from "inversify";
import { Messages } from "../messages";
import { DateTime } from "luxon"; 

interface StartSurveyData {
  startAreaIndex: number
}

export class StartSurveyAction extends Action {
  constructor(
    @inject(TYPES.IQuestionService) private readonly questionService: IQuestionService,
    @inject(TYPES.Messages) private readonly messages: Messages
  ) {
    super(/^{"startAreaIndex":.+?}+$/);
  }

  public async handle(ctx: ActionsContext): Promise<void> {
    if (!ctx.session?.id) return;

    const currentSession = ctx.session as UserSessionData;

    if (!currentSession.isPhoneVerified) return;

    if (currentSession.survey.isFinished) return;
    
    const response = JSON.parse(ctx.match.input) as StartSurveyData;
    const areaIndex = response.startAreaIndex;

    try {
      await ctx.deleteMessage();
    } catch (error) {
      // suppress error while fast clicking on buttons
      return;
    }


    currentSession.survey.isOngoing = true;
    currentSession.survey.startTime = DateTime.now().toISO() || "";

    currentSession.survey.current.competenceAreaIndex = areaIndex;
    currentSession.survey.current.sectionIndex = 0;
    currentSession.survey.current.questionIndex = 0;

    const formattedQuestion = this.questionService.getFormattedQuestion(areaIndex, 0, 0);

    await this.messages.replyWithSurveyButtons(ctx, formattedQuestion);


    currentSession.survey.results.push({
      competenceAreaIndex: areaIndex,
      areaResults: this.questionService.getSections(areaIndex).map((_, index) => ({
        sectionIndex: index,
        sectionResults: [],
        sectionSum: 0,
      })),
    });
    
  }
}