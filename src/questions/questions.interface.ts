export interface IQuestionService {
  getQuestions(): Question[]
  getFirstQuestion(): Question
  getQuestion(index: number): Question
  getFormattedQuestion(index: number): string
}

export interface Question {
  title: string,
  text: string
}