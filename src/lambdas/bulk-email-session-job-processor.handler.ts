import { getDB } from '../lib/db';
import { send30MinsEmailsNotifs, sendDailyNotifs } from '../lib/email-activity-manager';

export const handler = async (event: any) => {
  const db = getDB();
  console.log('event', event);

  /* 
    - this handler will get invoked at the interval specified by the EventBridge Rule (i.e. 30 minutes in production, 3 minutes in development/testing)


    IMPORTANT:
    - Test this with 3-minute (for 30-minute session) and any multiple of 3 for daily session (i.e. 6, 9, 12, 15) while developing
    - This means that the Rule will use a 3-minute interval during development
  */

  await send30MinsEmailsNotifs();

  await sendDailyNotifs();
};
