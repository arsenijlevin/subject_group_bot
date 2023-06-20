import { config, DotenvParseOutput } from "dotenv";
import { injectable } from "inversify";
import { IConfigService } from "./config.interface";

@injectable()
export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;

  constructor() {
    const { error, parsed, } = config();

    if (error) {
      throw new Error("Error loading .env file!");
    }

    if (!parsed) {
      throw new Error("Empty .env file!");
    }

    this.config = parsed;
  }

  public get(key: string): string {
    const res = this.config[key];

    if (!res) {
      throw new Error(`Key ${key} not found in .env!`);
    }

    return res;
  }

  public getBotToken(): string {
    return this.get("BOT_TOKEN");
  }

  public getGoogleAPIPrivateKey(): string {
    return this.get("GOOGLE_PRIVATE_KEY").split(String.raw`\n`).join('\n');
  }

  public getAdmin(): string {
    return this.get("ADMIN");
  }
}