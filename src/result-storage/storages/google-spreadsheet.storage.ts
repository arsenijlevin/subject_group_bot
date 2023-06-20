import { IConfigService } from "@config/config.interface";
import TYPES from "@container/types";
import { IQuestionService } from "@questions/questions.interface";
import { GoogleSpreadsheet, TextFormat } from "google-spreadsheet";
import { inject, injectable } from "inversify";
import { IResultStorage, StorageData } from "../result-storage.interface";

@injectable()
export class GoogleSpreadsheetStorage implements IResultStorage {
  public storage: GoogleSpreadsheet;

  constructor(
    @inject(TYPES.IConfigService) private readonly configService: IConfigService,
    @inject(TYPES.IQuestionService) private readonly questionService: IQuestionService
  ) {
    this.storage = new GoogleSpreadsheet(configService.get("GOOGLE_SHEET_ID"));
  }

  public async save(data: StorageData): Promise<void> {
    const sheet = this.storage.sheetsByIndex[0];

    if (!sheet) {
      throw new Error("Sheet with index 0 not found!");
    }

    let rowIndex = 0;
    let columnIndex = 1;
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

    this.questionService.getCompetenceAreas().forEach((area, areaIndex) => {
      area.sections.forEach((section, sectionIndex) => {
        const areaResult = data.survey.results.find(area => area.competenceAreaIndex === areaIndex)?.areaResults || [];
        const sectionResult = areaResult?.find(result => result.sectionIndex === sectionIndex);
        const sectionResultSum = sectionResult?.sectionSum;

        const sectionResultPercent =
          sectionResultSum ? (sectionResultSum / (section.sectionQuestions.length * 5)) * 100 : 0;
        sheet.getCell(rowIndex++, columnIndex).value = sectionResultSum ? `${sectionResultSum} (${sectionResultPercent.toFixed(2)}%)` : "";

        section.sectionQuestions.forEach((_, questionIndex) => {
          const answer = sectionResult?.sectionResults[questionIndex];

          sheet.getCell(rowIndex++, columnIndex).value = answer || "";
        });
      });
    });

    rowIndex += 2;


    this.questionService.getCompetenceAreas().map((area, areaIndex) => {
      const areaResults = data.survey.results.find(result => result.competenceAreaIndex === areaIndex)?.areaResults;

      const unsortedSectionResults = areaResults?.map(result => ({
        index: result.sectionIndex,
        sum: result.sectionSum,
      }));
      const sortedSectionResults = unsortedSectionResults?.sort((a, b) => a.sum - b.sum);
      const minimumSectionsIndices =
        sortedSectionResults?.slice(0, area.maxBadSections).map(result => result.index);

      area.sections.map((section, sectionIndex) => {
        const areaResult = data.survey.results.find(area => area.competenceAreaIndex === areaIndex)?.areaResults || [];
        const sectionResult = areaResult?.find(result => result.sectionIndex === sectionIndex);
        const sectionResultSum = sectionResult?.sectionSum;

        const sectionResultPercent =
          sectionResultSum ? ((sectionResultSum / (section.sectionQuestions.length * 5)) * 100).toFixed(0) : 0;

        const sectionResultText = `${sectionResultSum || ""} (${sectionResultPercent || ""} %)`;

        const textFormat: TextFormat = {
          bold: minimumSectionsIndices?.includes(sectionIndex),
        };
        sheet.getCell(rowIndex, columnIndex).textFormat = sectionResultSum ? textFormat : {};
        sheet.getCell(rowIndex++, columnIndex).value = sectionResultSum ? sectionResultText : "";
      });

      rowIndex += 2;
      // const sectionResult = data.survey.sectionResults[index];
      // const sectionResultPercent = (sectionResult / (section.sectionQuestions.length * 5)) * 100;
      // const sectionResultText = sectionResult ? `${sectionResult} (${sectionResultPercent.toFixed(2)}%)` : "";
      // const textFormat: TextFormat = {
      //   bold: minimumSectionsIndices.includes(index),
      // };

      // sheet.getCell(rowIndex, columnIndex).textFormat = textFormat;
      // sheet.getCell(rowIndex++, columnIndex).value = sectionResultText;
    });

    await sheet.saveUpdatedCells();
  }

  public async init(): Promise<void> {
    await this.storage.useServiceAccountAuth({
      client_email: this.configService.get("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: this.configService.getGoogleAPIPrivateKey(),
    });

    await this.storage.loadInfo();

    await this.storage.sheetsByIndex[0].resize({ rowCount: 250, columnCount: 20, });
  }

  public async loadStorage(): Promise<void> {
    await this.storage.sheetsByIndex[0].loadCells();
  }

  public async increaseCapacity(value: number): Promise<void> {
    const mainSheet = this.storage.sheetsByIndex[0];
    await mainSheet.resize({ rowCount: 250, columnCount: mainSheet.columnCount + value, });
  }
}