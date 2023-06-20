import { Action } from "@abstract/actions.class";
import TYPES from "@container/types";
import { ActionsContext } from "@context/actions.context";
import { UserSessionData } from "@context/bot.context";
import { IQuestionService } from "@questions/questions.interface";
import { inject } from "inversify";
import { DateTime } from "luxon";
import { IResultStorageService } from "src/result-storage/result-storage.interface";
import { Answers, Messages } from "../messages";

interface AnswerData {
  answer: Answers;
}

export class AnswerSurveyAction extends Action {
  constructor(
    @inject(TYPES.IQuestionService) private readonly questionService: IQuestionService,
    @inject(TYPES.Messages) private readonly messages: Messages,
    @inject(TYPES.IResultStorageService) private readonly resultStorageService: IResultStorageService
  ) {
    super(/^{"answer":.+?}+$/);
  }

  public async handle(ctx: ActionsContext): Promise<void> {
    if (!ctx.session?.id) return;

    const currentSession = ctx.session as UserSessionData;

    if (!currentSession.isPhoneVerified) return;

    if (currentSession.survey.isFinished || !currentSession.survey.isOngoing) return;

    try {
      await ctx.deleteMessage();
    } catch (error) {
      // suppress error while fast clicking on buttons
      return;
    }

    const response = JSON.parse(ctx.match.input) as AnswerData;
    const answer = response.answer;

    const currentSurvey = currentSession.survey;
    const currentQuestion = currentSurvey.current.questionIndex;

    const isSurveyFinished = currentQuestion === this.questionService.getQuestions().length - 1;

    currentSurvey.result.answers.push(answer);

    currentSession.survey.current.questionIndex++;

    await this.resultStorageService.save(currentSession);

    if (isSurveyFinished) {
      this.endSurvey(ctx, currentSession);
    } else {
      await this.proceedSurvey(ctx, currentSession);
    }
  }


  private timeoutClosingMessage(ctx: ActionsContext): void {
    setTimeout(async () => {
      await this.messages.replyWithClosingMessage(ctx);
    }, 3500);
  }

  private endSurvey(ctx: ActionsContext, currentSession: UserSessionData): void {
    currentSession.survey.isFinished = true;
    currentSession.survey.endTime = DateTime.now().toISO() || "";

    this.timeoutClosingMessage(ctx);
  }

  private async proceedSurvey(ctx: ActionsContext, currentSession: UserSessionData): Promise<void> {
    const newQuestionIndex = currentSession.survey.current.questionIndex;

    const newFormattedQuestion = this.questionService.getFormattedQuestion(newQuestionIndex);

    await this.messages.replyWithSurveyButtons(ctx, newFormattedQuestion);
  }
}