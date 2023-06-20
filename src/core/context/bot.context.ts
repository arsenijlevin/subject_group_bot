import { Context } from "telegraf";

export type SessionData = {
  id: number;
}

export interface PhoneAccess {
  phoneNumber: string,
  accessEndDateTimeISO: string
}

export interface AdminSessionData extends SessionData {
  addedPhones?: PhoneAccess[]
}

export interface UserSessionData extends SessionData {
  isPhoneVerified: boolean,
  isEnteringPhone: boolean,
  isEnteringFullName: boolean,
  fullName: string,
  nickname: string,
  phoneNumber: string,
  survey: Survey
}

export interface IBotContext extends Context {
  session: SessionData | undefined;
}

export interface Survey {
  isOngoing: boolean,
  isFinished: boolean,
  startTime: string,
  endTime: string,
  current: CurrentSurveyStage,
  result: SurveyResult
}

export interface CurrentSurveyStage {
  questionIndex: number
}

export interface SurveyResult {
  answers: number[]
}
