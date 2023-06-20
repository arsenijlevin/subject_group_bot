export interface IQuestionService {
  getSections(areaIndex: number): QuestionSection[]
  getFirstSection(areaIndex: number): QuestionSection
  getSection(areaIndex: number, sectionIndex: number): QuestionSection
  getFormattedQuestion(competenceAreaIndex: number, sectionIndex: number, questionIndex: number): string
  getCompetenceAreas(): CompetenceAreas[]
}

export interface QuestionSection {
  sectionName: string,
  sectionQuestions: string[]
}

export interface CompetenceAreas {
  title: string,
  sections: QuestionSection[],
  maxBadSections: number
}