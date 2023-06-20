import { injectable } from "inversify";
import { IQuestionService, Question } from "./questions.interface";
import * as fs from "fs";

@injectable()
export class QuestionService implements IQuestionService {
  private questions: Question[] = [];

  constructor() {
    const questionsFromFile = fs.readFileSync("questions.json");

    this.questions = JSON.parse(questionsFromFile.toString()) as Question[];

    if (this.questions.length === 0) {
      throw new Error("No questions in questions.json");
    }
  }
  public getQuestions(): Question[] {
    return this.questions;
  }

  public getFirstQuestion(): Question {
    return this.questions[0];
  }

  public getQuestion(index: number): Question {
    return this.questions[index];
  }

  public getFormattedQuestion(index: number): string {
    const question = this.getQuestion(index);
    const questionTitle = `<b>${question.title}</b>`;
    const questionText = question.text;
    const questionNumber = `${index + 1}.`;

    return `${questionTitle}\n\n${questionNumber} ${questionText}`;
  }
}