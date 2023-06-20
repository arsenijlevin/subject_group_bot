import { Bot } from "./core/bot";
import TYPES from "@container/types";
import { container } from "@container/container";
import { IResultStorage } from "src/result-storage/result-storage.interface";

const bot = container.get<Bot>(TYPES.Bot);
const googleSpreadsheet = container.get<IResultStorage>(TYPES.IResultStorage);

googleSpreadsheet.init().then(() => {
  console.log("Google spreadsheet is ready!");
  
  void bot.start();
}).catch(err => {
  console.error(err);
});
