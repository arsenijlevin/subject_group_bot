import 'reflect-metadata';
import TYPES from './types';

import { Container } from 'inversify';

import { Action } from '@abstract/actions.class';
import { Command } from '@abstract/command.class';

import { StartCommand } from '@commands/start.command';
import { RestartCommand } from '@commands/restart.command';

import { IConfigService } from '@config/config.interface';
import { ConfigService } from '@config/config.service';

import { Bot } from '../bot';
import { GoogleSpreadsheetStorage } from 'src/result-storage/storages/google-spreadsheet.storage';
import { ResultStorageService } from 'src/result-storage/result-storage.service';
import { IResultStorage, IResultStorageService } from 'src/result-storage/result-storage.interface';
import { Trigger } from '@abstract/trigger.class';

import { AdminMessage } from '@triggers/messages/admin.message';
import { Message } from '@abstract/triggers/message.class';
import { MessageTrigger } from '@triggers/message.trigger';
import { ISession } from '@session/session.interface';
import { LocalSession } from '@session/sessions/local.session';
import { ContactMessage } from '@triggers/messages/contact.message';
import { Messages } from 'src/messages';
import { EnteringPhoneMessage } from '@triggers/messages/entering-phone.message';
import { StartSurveyAction } from '@actions/start-survey.action';
import { EnteringFullName } from '@triggers/messages/entering-full-name.message';
import { IQuestionService } from '@questions/questions.interface';
import { QuestionService } from '@questions/questions.service';
import { AnswerSurveyAction } from '@actions/answer-survey.action';
import { TimeoutService } from 'src/timeout/timeout.service';
import { ITimeoutService } from 'src/timeout/timeout.interface';
import { NullAction } from '@actions/null.action';

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
});

container.bind<Action>(TYPES.Action).to(StartSurveyAction);
container.bind<Action>(TYPES.Action).to(AnswerSurveyAction);
container.bind<Action>(TYPES.Action).to(NullAction);

container.bind<Command>(TYPES.Command).to(StartCommand);
container.bind<Command>(TYPES.Command).to(RestartCommand);

container.bind<Message>(TYPES.Message).to(AdminMessage);
container.bind<Message>(TYPES.Message).to(ContactMessage);
container.bind<Message>(TYPES.Message).to(EnteringPhoneMessage);
container.bind<Message>(TYPES.Message).to(EnteringFullName);

container.bind<Trigger>(TYPES.Trigger).to(MessageTrigger);

container.bind<IConfigService>(TYPES.IConfigService).to(ConfigService);
container.bind<ISession>(TYPES.ISession).to(LocalSession);

container.bind<Bot>(TYPES.Bot).to(Bot);

container.bind<IResultStorage>(TYPES.IResultStorage).to(GoogleSpreadsheetStorage);
container.bind<IResultStorageService>(TYPES.IResultStorageService).to(ResultStorageService);
container.bind<ITimeoutService>(TYPES.ITimeoutService).to(TimeoutService);

container.bind<IQuestionService>(TYPES.IQuestionService).to(QuestionService);

container.bind<Messages>(TYPES.Messages).to(Messages);
export { container };