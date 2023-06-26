import { IConfigService } from "@config/config.interface";
import TYPES from "@container/types";
import { IQuestionService } from "@questions/questions.interface";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { inject, injectable } from "inversify";
import { Answers } from "src/messages";
import { IResultStorage, StorageData } from "../result-storage.interface";

interface TimeoutUser {
  saveData: StorageData,
  timeout: NodeJS.Timeout
}

@injectable()
export class GoogleSpreadsheetStorage implements IResultStorage {
  public storage: GoogleSpreadsheet;

  private delaySaveTimeouts: TimeoutUser[] = [];

  private readonly delayInMilliseconds = 10000;

  constructor(
    @inject(TYPES.IConfigService) private readonly configService: IConfigService,
    @inject(TYPES.IQuestionService) private readonly questionService: IQuestionService
  ) {
    this.storage = new GoogleSpreadsheet(configService.get("GOOGLE_SHEET_ID"));
  }

  public async save(data: StorageData): Promise<void> {
    try {
      await this.saveToSheet(data);
    } catch (err) {
      await this.loadStorage();
      this.delaySave(data);
    }
  }

  public async init(): Promise<void> {
    await this.storage.useServiceAccountAuth({
      client_email: this.configService.get("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: this.configService.getGoogleAPIPrivateKey(),
    });

    await this.storage.loadInfo();

    await this.loadStorage();

    const mainSheet = this.storage.sheetsByIndex[0];
    await this.storage.sheetsByIndex[0].resize({ rowCount: 150, columnCount: mainSheet.columnCount, });
  }

  public async loadStorage(): Promise<void> {
    try {
      await this.storage.sheetsByIndex[0].loadCells();
    } catch (error) {
      return;
    }
  }

  public async increaseCapacity(value: number): Promise<void> {
    const mainSheet = this.storage.sheetsByIndex[0];
    await mainSheet.resize({ rowCount: 150, columnCount: mainSheet.columnCount + value, });
  }

  private async saveToSheet(data: StorageData): Promise<void> {
    const sheet = this.storage.sheetsByIndex[0];

    if (!sheet) {
      throw new Error("Sheet with index 0 not found!");
    }

    let rowIndex = 0;
    let columnIndex = 3;
    let cellValue = sheet.getCell(rowIndex, columnIndex).value?.toString();


    while (cellValue && !cellValue.trim().startsWith(data.phoneNumber)) {
      columnIndex++;
      cellValue = sheet.getCell(rowIndex, columnIndex).value?.toString();
    }

    rowIndex = 0;

    sheet.getCell(rowIndex++, columnIndex).value = data.phoneNumber;
    sheet.getCell(rowIndex++, columnIndex).value = data.fullName;
    sheet.getCell(rowIndex++, columnIndex).value = data.nickname ? "@" + data.nickname : "";

    rowIndex += 2;

    this.questionService.getQuestions().forEach((_, index) => {
      let answer = data.survey.result.answers[index] || "";

      switch (answer) {
        case Answers.YES: {
          answer = "Да";
          break;
        }
        case Answers.NO: {
          answer = "Нет";
          break;
        }
        default: {
          answer = "";
          break;
        }
      }

      sheet.getCell(rowIndex++, columnIndex).value = answer;
    });

    await sheet.saveUpdatedCells();
  }

  private delaySave(data: StorageData): void {
    const timeoutUserObject = this.delaySaveTimeouts.find(timeout => timeout.saveData.id === data.id);

    if (timeoutUserObject) {
      timeoutUserObject.saveData = data;
      return;
    }

    const timeout = setTimeout(async () => {
      const timeoutUserObject = this.delaySaveTimeouts.find(timeout => timeout.saveData.id === data.id);

      if (!timeoutUserObject) return;

      await this.loadStorage();
      await this.save(timeoutUserObject.saveData);

      this.clearDelaySaveTimeout(data.id);
    }, this.delayInMilliseconds);

    this.delaySaveTimeouts.push({
      saveData: data,
      timeout: timeout,
    });

    console.log(`Timeout sheet added for user ${data.id}`);
  }

  private clearDelaySaveTimeout(userId: number): void {
    const timeoutUserObject = this.delaySaveTimeouts.find(timeout => timeout.saveData.id === userId);

    if (!timeoutUserObject) return;

    clearTimeout(timeoutUserObject.timeout);
    this.delaySaveTimeouts = this.delaySaveTimeouts
      .filter(saveTimeout => saveTimeout.saveData.id !== userId);

    console.log(`Timeout sheet removed for user ${timeoutUserObject.saveData.id}`);
  }
}