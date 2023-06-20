import { Action } from "@abstract/actions.class";
import TYPES from "@container/types";
import { ActionsContext } from "@context/actions.context";
import { UserSessionData } from "@context/bot.context";
import { IQuestionService } from "@questions/questions.interface";
import { inject } from "inversify";
import { DateTime } from "luxon";
import { IResultStorageService } from "src/result-storage/result-storage.interface";
import { Markup } from "telegraf";
import { InlineKeyboardButton } from "telegraf/types";
import { Messages } from "../messages";

interface AnswerData {
  answer: number;
}

type CallbackButton = InlineKeyboardButton.CallbackButton;

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

    const currentSurvey = currentSession.survey.current;

    const currentCompetenceArea = currentSurvey.competenceAreaIndex;
    const currentSectionIndex = currentSurvey.sectionIndex;
    const currentQuestionInSectionIndex = currentSurvey.questionIndex;

    const currentSection = this.questionService.getSection(currentCompetenceArea, currentSectionIndex);


    const currentAreaResult =
      currentSession.survey.results.find(result => result.competenceAreaIndex === currentCompetenceArea);
    if (!currentAreaResult) return;

    const currentSectionResults =
      currentAreaResult.areaResults.find(result => result.sectionIndex === currentSectionIndex);
    if (!currentSectionResults) return;

    currentSectionResults.sectionResults.push(answer);
    currentSectionResults.sectionSum += answer;

    const isEverySectionAnswered = currentAreaResult.areaResults.every(result => result.sectionResults.length >= 5);

    const isSurveyLastArea =
      currentSession.survey.results.length === this.questionService.getCompetenceAreas().length;
    const isSurveySectionFinished = currentQuestionInSectionIndex === currentSection.sectionQuestions.length - 1;
    const isSurveyCompetenceAreaFinished = isSurveySectionFinished && isEverySectionAnswered;
    const isSurveyFinished = isSurveyLastArea && isSurveyCompetenceAreaFinished;



    if (isSurveySectionFinished) {
      currentSession.survey.current.sectionIndex++;
      currentSession.survey.current.questionIndex = -1;

      await this.replyWithIntermediateResult(ctx, currentSession);

      await this.resultStorageService.save(currentSession);
    }

    currentSession.survey.current.questionIndex++;

    if (isSurveyFinished) {
      await this.endSurvey(ctx, currentSession);

      this.timeoutClosingMessage(ctx);

      return;
    }

    if (isSurveyCompetenceAreaFinished) {
      await this.replyWithCompetenceComplete(ctx, currentSession);

      return;
    }

    await this.proceedSurvey(ctx, currentSession);
  }

  private async replyWithCompetenceComplete(ctx: ActionsContext, currentSession: UserSessionData): Promise<void> {
    const currentCompetenceAreaIndex = currentSession.survey.current.competenceAreaIndex;
    const resultText = this.getTotalResultForCompetence(currentCompetenceAreaIndex, currentSession);

    await ctx.reply(resultText, {
      reply_markup: Markup.inlineKeyboard(this.createCompetenceCompleteMarkup(currentSession)).reply_markup,
      parse_mode: "HTML",
    });
  }

  private createCompetenceCompleteMarkup(currentSession: UserSessionData): CallbackButton[] {
    const buttons: CallbackButton[] = [];
    this.questionService.getCompetenceAreas().forEach((area, areaIndex) => {
      if (currentSession.survey.results.find(result => result.competenceAreaIndex === areaIndex)) {
        buttons.push(
          Markup.button.callback(`✅ «${area.title.toUpperCase()}»`, "null")
        );
      } else {
        buttons.push(
          Markup.button.callback(`«${area.title.toUpperCase()}»`, `{"continueSurveyIndex":${areaIndex}}`)
        );
      }
    });

    return buttons;
  }

  private timeoutClosingMessage(ctx: ActionsContext): void {
    setTimeout(async () => {
      await this.messages.replyWithClosingMessage(ctx);
    }, 3500);
  }

  private async endSurvey(ctx: ActionsContext, currentSession: UserSessionData): Promise<void> {
    currentSession.survey.isFinished = true;
    currentSession.survey.endTime = DateTime.now().toISO() || "";

    await this.replyWithTotalResult(ctx, currentSession);
  }

  private async proceedSurvey(ctx: ActionsContext, currentSession: UserSessionData): Promise<void> {
    const newSectionIndex = currentSession.survey.current.sectionIndex;
    const newQuestionIndex = currentSession.survey.current.questionIndex;
    const competenceAreaIndex = currentSession.survey.current.competenceAreaIndex;

    const newFormattedQuestion = this.questionService.getFormattedQuestion(
      competenceAreaIndex,
      newSectionIndex,
      newQuestionIndex
    );

    await this.messages.replyWithSurveyButtons(ctx, newFormattedQuestion);
  }

  private async replyWithIntermediateResult(ctx: ActionsContext, currentSession: UserSessionData): Promise<void> {
    const sectionIndex = currentSession.survey.current.sectionIndex - 1;
    const competenceAreaIndex = currentSession.survey.current.competenceAreaIndex;
    const section = this.questionService.getSection(competenceAreaIndex, sectionIndex);
    const competenceArea = this.questionService.getCompetenceAreas()[competenceAreaIndex];
    const maxScore = section.sectionQuestions.length * 5;
    const currentAreaResult =
      currentSession.survey.results.find(result => result.competenceAreaIndex === competenceAreaIndex);
    if (!currentAreaResult) return;

    const currentSectionResults =
      currentAreaResult.areaResults.find(result => result.sectionIndex === sectionIndex);
    if (!currentSectionResults) return;

    const userSectionResult = currentSectionResults.sectionSum;
    const userSectionResultPercent = (userSectionResult / maxScore * 100).toFixed(0);

    await ctx.reply(` 
<b>Промежуточный результат</b>

<b>Сфера компетентности «${competenceArea.title.toUpperCase()}»</b>   
<b>Блок:</b> <i>${section.sectionName}</i>

<b>Максимальный балл:</b> <i>${maxScore}</i>
<b>Ваш результат:</b> <i>${userSectionResult} (${userSectionResultPercent}%)</i>
`, { parse_mode: "HTML", });
  }

  private async replyWithTotalResult(ctx: ActionsContext, currentSession: UserSessionData): Promise<void> {
    let replyText = "<b>Рейтинг компетенций</b>\n";

    this.questionService.getCompetenceAreas().forEach((area, areaIndex) => {
      replyText += this.getTotalResultForCompetence(areaIndex, currentSession);
    });

    await ctx.reply(replyText, { parse_mode: "HTML", });
  }

  private getTotalResultForCompetence(competenceIndex: number, currentSession: UserSessionData): string {
    const competenceArea = this.questionService.getCompetenceAreas()[competenceIndex];
    const currentResults = currentSession.survey.results.find(result => result.competenceAreaIndex === competenceIndex);
    let totalText = `\n<b>Сфера компетентности «${competenceArea.title.toUpperCase()}»</b>\n\n`;

    if (!currentResults) return "";

    const unsortedSectionResults = currentResults.areaResults.map(result => ({
      index: result.sectionIndex,
      sum: result.sectionSum,
    }));
    const sortedSectionResults = unsortedSectionResults.sort((a, b) => a.sum - b.sum);

    const sectionsCount = this.questionService.getSections(competenceIndex).length;
    const minimumSectionsIndices =
      sortedSectionResults.slice(0, competenceArea.maxBadSections).map(result => result.index);

    for (let index = 0; index < sectionsCount; index++) {
      const minIndex = index;
      if (!minimumSectionsIndices.includes(minIndex)) continue;
      const minSection = this.questionService.getSection(competenceIndex, minIndex);

      const maxScore = minSection.sectionQuestions.length * 5;
      const minSectionsInArea = currentResults.areaResults.find(areaResult => areaResult.sectionIndex === minIndex);
      if (!minSectionsInArea) continue;
      const minSectionResult = minSectionsInArea.sectionSum;
      if (!minSectionResult) continue;

      const minSectionResultPercent = (minSectionResult / maxScore * 100).toFixed(0);

      totalText += `<b>❗ ${minSection.sectionName}: <i>${minSectionResult} (${minSectionResultPercent}%)</i></b>\n`;
    }

    totalText += `\n`;

    for (let index = 0; index < sectionsCount; index++) {
      if (minimumSectionsIndices.includes(index)) continue;
      const section = this.questionService.getSection(competenceIndex, index);

      const maxScore = section.sectionQuestions.length * 5;
      const sectionsInArea = currentResults.areaResults.find(areaResult => areaResult.sectionIndex === index);
      if (!sectionsInArea) continue;
      const sectionResult = sectionsInArea.sectionSum;
      if (!sectionResult) continue;

      const sectionResultPercent = (sectionResult / maxScore * 100).toFixed(0);

      totalText += `✅ ${section.sectionName}: <i>${sectionResult} (${sectionResultPercent}%)</i>\n`;
    }

    return totalText;
  }
}