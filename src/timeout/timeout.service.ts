import { inject, injectable } from "inversify";
import { ITimeoutService } from "./timeout.interface";
import TYPES from "@container/types";
import { ISession } from "@session/session.interface";
import { DateTime } from "luxon";
import { PhoneAccess } from "@context/bot.context";

@injectable()
export class TimeoutService implements ITimeoutService {
  private readonly runningTimeouts: NodeJS.Timeout[] = [];

  constructor(
    @inject(TYPES.ISession) private readonly session: ISession
  ) { }

  public refreshTimeouts(): void {
    const adminSession = this.session.getAdminSession();
    const addedPhones = adminSession?.addedPhones;
    if (!adminSession) return;
    if (!addedPhones) return;

    this.clearTimeouts();

    addedPhones.forEach(addedPhone => this.addPhoneExpireTimeout(addedPhone));
  }

  public addPhoneExpireTimeout(phoneToExpire: PhoneAccess): void {
    if (!phoneToExpire || !phoneToExpire.phoneNumber || !phoneToExpire.accessEndDateTimeISO) return;

    const timeoutTime = DateTime.fromISO(phoneToExpire.accessEndDateTimeISO).diff(DateTime.now()).toMillis();
    const timeout = setTimeout(() => this.handlePhoneAccessExpire(phoneToExpire), timeoutTime);

    this.runningTimeouts.push(timeout);

    console.log(`
--
Timeout added from phoneNumber ${phoneToExpire.phoneNumber}.
Expire DateTime: ${phoneToExpire.accessEndDateTimeISO}.
Ends in: ${timeoutTime} milliseconds
--`);

  }

  private clearTimeouts(): void {
    this.runningTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
  }

  private handlePhoneAccessExpire(phoneToExpire: PhoneAccess): void {
    if (!phoneToExpire || !phoneToExpire.phoneNumber || !phoneToExpire.accessEndDateTimeISO) return;
        
    const adminSession = this.session.getAdminSession();
    const addedPhones = adminSession?.addedPhones;
    if (!adminSession) return;
    if (!addedPhones) return;

    const filteredPhones = addedPhones.filter(phone => phoneToExpire.phoneNumber !== phone.phoneNumber);
    
    this.session.setAddedPhones(filteredPhones);

    console.log(`
--
Timeout removed from phoneNumber ${phoneToExpire.phoneNumber}.
Expire DateTime: ${phoneToExpire.accessEndDateTimeISO}.
--`);

    console.log(this.session.getAdminSession()?.addedPhones);

  }
}