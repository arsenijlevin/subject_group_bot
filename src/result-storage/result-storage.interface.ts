import { Survey } from "@context/bot.context";

export interface IResultStorageService {
  save(data: StorageData) : Promise<void>;
  loadStorage(): Promise<void>;
  increaseCapacity(value : number): Promise<void>;
}

export interface IResultStorage {
  save(data: StorageData) : Promise<void>;
  loadStorage(): Promise<void>;
  init(): Promise<void>;
  increaseCapacity(value : number): Promise<void>
}

export type StorageData = {
  phoneNumber : string,
  fullName : string,
  nickname : string,
  survey: Survey
};