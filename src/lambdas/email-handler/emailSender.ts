/* eslint-disable @typescript-eslint/no-var-requires */
import { SES, SendEmailResponse, SendEmailRequest, SendEmailCommand } from '@aws-sdk/client-ses';
// import {
//   EnvironmentVariable,
//   isProduction,
//   requireConfiguration,
// } from '@/config'
// import { captureAWSClient } from 'aws-xray-sdk'
import { renderTemplate } from './renderer';
import { SendEmailData } from '../../lib/email-activity-manager';

// const ses = captureAWSClient(new SES())
const ses = new SES({ region: 'us-east-1' });

export const sendEmail = async (opts: SendEmailData) => {
  const { template, subject, templateData, destination, forceSend = false } = opts;
  const { EMAIL_SENDER = 'no-reply@websiteexample.com', WEB_APP_DOMAIN, NODE_ENV } = process.env;
  const emailSender = EMAIL_SENDER;
  const webAppLogoSrc = `https://${WEB_APP_DOMAIN}/images/my-file-logo-head.svg`;
  const body = renderTemplate(template, {
    ...templateData,
    webAppLogoSrc,
  });

  console.log('sending email: ', body);

  const sendEmailCommand = new SendEmailCommand({
    Destination: destination,
    Source: emailSender,
    Message: {
      Subject: {
        Data: subject,
        Charset: 'utf-8',
      },
      Body: {
        Html: {
          Charset: 'utf-8',
          Data: body,
        },
      },
    },
  });

  const resp = await ses.send(sendEmailCommand);
  console.warn('send email response is ', resp);
  return resp;
};
