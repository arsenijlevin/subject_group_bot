import TYPES from "@container/types";
import { inject, injectable } from "inversify";
import { IResultStorage, IResultStorageService, StorageData } from "./result-storage.interface";

@injectable()
export class ResultStorageService implements IResultStorageService {
  constructor(
    @inject(TYPES.IResultStorage) private readonly resultStorage : IResultStorage
  ) { }
  public async loadStorage(): Promise<void> {
    await this.resultStorage.loadStorage();
  }

  public async increaseCapacity(value: number): Promise<void> {
    await this.resultStorage.increaseCapacity(value);
  }

  // TODO: Refactor
  public async save(data: StorageData): Promise<void> {
    try {
      await this.resultStorage.save(data);
    } catch {
      await this.loadStorage();
      await this.resultStorage.save(data);
    }
    
  }
}