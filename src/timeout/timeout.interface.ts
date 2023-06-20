import { PhoneAccess } from "@context/bot.context";

export interface ITimeoutService {
  refreshTimeouts() : void;
  addPhoneExpireTimeout(phoneToExpire: PhoneAccess): void;
}