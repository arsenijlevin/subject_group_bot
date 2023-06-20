export interface IConfigService {
  get(key: string): string;
  getBotToken(): string;
  getAdmin(): string;
  getGoogleAPIPrivateKey(): string;
}