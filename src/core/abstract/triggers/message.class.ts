import { MessagesContext } from "@context/message.context";
import { injectable } from "inversify";

@injectable()
export abstract class Message {
  public abstract handle(ctx: MessagesContext): Promise<void>;
}