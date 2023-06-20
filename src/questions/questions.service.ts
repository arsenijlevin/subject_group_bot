import { injectable } from "inversify";
import { CompetenceAreas, IQuestionService, QuestionSection } from "./questions.interface";
import * as fs from "fs";

@injectable()
export class QuestionService implements IQuestionService {
  private competenceAreas: CompetenceAreas[] = [];

  constructor() {
    const questionsFromFile = fs.readFileSync("questions.json");

    this.competenceAreas = JSON.parse(questionsFromFile.toString()) as CompetenceAreas[];

    if (this.competenceAreas.length === 0) {
      throw new Error("No competenceAreas in questions.json");
    }
  }

  public getCompetenceAreas(): CompetenceAreas[] {
    return this.competenceAreas;
  }

  public getSections(areaIndex : number): QuestionSection[] {
    return this.competenceAreas[areaIndex].sections;
  }

  public getFirstSection(areaIndex: number): QuestionSection {
    return this.competenceAreas[areaIndex].sections[0];
  }

  public getSection(areaIndex:number, sectionIndex: number): QuestionSection {
    return this.competenceAreas[areaIndex].sections[sectionIndex];
  }

  public getFormattedQuestion(competenceAreaIndex: number, sectionIndex: number, questionIndex: number): string {
    const competenceArea = this.competenceAreas[competenceAreaIndex];
    const section = competenceArea.sections[sectionIndex];

    const competenceTitleText = `<b>Элемент компетентности «${competenceArea.title.toUpperCase()}»</b>  `;
    const sectionTitleText = `<b>Блок: ${section.sectionName}</b>`;
    const questionText = section.sectionQuestions[questionIndex];

    return `${competenceTitleText}\n${sectionTitleText}\n\n${questionText}`;
  }
}