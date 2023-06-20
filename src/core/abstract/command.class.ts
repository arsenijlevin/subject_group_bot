import { CommandsContext } from "@context/commands.context";
import { injectable } from "inversify";

@injectable()
export abstract class Command {
  constructor(
    public triggerText : string
  ) { }

  public abstract handle(ctx : CommandsContext): void;
}