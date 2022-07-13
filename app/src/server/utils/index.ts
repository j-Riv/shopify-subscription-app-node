import mailgun from 'mailgun-js';
import dotenv from 'dotenv';
import Logger from '../logger.js';
import { SubscriptionContract } from '../types/subscriptions';
dotenv.config();

export const generateNextBillingDate = (
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
  intervalCount: number,
) => {
  let now = new Date();

  switch (interval) {
    case 'DAY':
      now.setDate(now.getDate() + intervalCount);
      break;
    case 'WEEK':
      now.setDate(now.getDate() + intervalCount * 7);
      break;
    case 'MONTH':
      // now.setMonth(now.getMonth() + intervalCount);
      now.setDate(now.getDate() + intervalCount * 30);
      break;
    case 'YEAR':
      now.setDate(now.getDate() + intervalCount * 365);
  }

  return new Date(now).toISOString().substring(0, 10);
  // return new Date(now).toISOString().substring(0, 10) + 'T00:00:00Z';
};

export const generateNewBillingDate = () => {
  let now = new Date();
  now.setDate(now.getDate() + 2);
  return new Date(now).toISOString().substring(0, 10);
};

export const sendMailGunPaymentFailure = async (
  shop: string,
  email: string,
  name: string,
  nextBillingDate: string,
) => {
  const subject = `Subscription Payment Failure`;
  const message = `<p>Hello ${name}, your subscription payment has failed. We will try again on ${nextBillingDate}. To update your payment method, log into your <a href="https://${shop}/account/login">account</a> and select manage subscriptions.</p>`;

  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });

  const data = {
    from: `${process.env.MAILGUN_SENDER} <no-reply@${process.env.MAILGUN_DOMAIN}>`,
    to: `${email}`,
    bcc: `${process.env.MAILGUN_ADMIN_EMAIL}`,
    subject: subject,
    html: message,
  };
  Logger.log('info', `Sending MailGun Subscription Payment Failure`);
  mg.messages().send(data, function (error, body) {
    if (error) Logger.log('error', `Error sending MailGun Payment Failure: ${error}`);
    Logger.log('info', `MailGun Payment Failure Response: ${body.message}`);
    return body.message;
  });
};

export const sendMailGunPause = async (
  shop: string,
  email: string,
  sub: SubscriptionContract,
  oosProducts: string[],
) => {
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });
  // get oos products
  let outOfStockList: string = '<ul>';
  oosProducts.forEach((variantProduct) => {
    outOfStockList += `
      <li>${variantProduct}</li>
    `;
  });
  outOfStockList += '</ul>';
  const id = sub.id.split('/');
  const data = {
    from: `${process.env.MAILGUN_SENDER} <no-reply@${process.env.MAILGUN_DOMAIN}>`,
    to: `${email}`,
    bcc: `${process.env.MAILGUN_ADMIN_EMAIL}`,
    subject: 'Subscription Has Been Paused Due To Item(s) Being Out Of Stock',
    html: `
      <p>Subscription (${
        id[id.length - 1]
      }) has been paused due to the following items being out of stock:</p>
      ${outOfStockList}
      <p>To manage your subscriptions, log in to your <a href="https://${shop}/account/login">account</a> and select manage subscriptions.</p>
    `,
  };
  Logger.log('info', `Sending MailGun Subscription Pause`);
  mg.messages().send(data, function (error, body) {
    if (error) Logger.log('error', `Error sending MailGun Subscription Pause: ${error}`);
    Logger.log('info', `MailGun Subscription Pause Response: ${body.message}`);
    return body.message;
  });
};

export const sendMailGunRenew = async (
  shop: string,
  email: string,
  name: string,
  nextBillingDate: string,
) => {
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });
  const data = {
    from: `${process.env.MAILGUN_SENDER} <no-reply@${process.env.MAILGUN_DOMAIN}>`,
    to: `${email}`,
    bcc: `${process.env.MAILGUN_ADMIN_EMAIL}`,
    subject: `Subscription Will Renew Soon`,
    html: `Hello ${name}, Your subscription will automatically renew on ${nextBillingDate}. To manage your subscriptions, log in to your <a href="https://${shop}/account/login">account</a> and select manage subscriptions.`,
  };
  Logger.log('info', `Sending MailGun Subscription Renewal Soon`);
  mg.messages().send(data, function (error, body) {
    if (error) Logger.log('error', `Error sending MailGun Subscription Renewal Soon: ${error}`);
    Logger.log('info', `MailGun Subscription Renewal Soon Response: ${body.message}`);
    return body.message;
  });
};
