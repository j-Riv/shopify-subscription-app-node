import type { WebhookHandlersParam } from '@shopify/shopify-app-express';
import { DeliveryMethod } from '@shopify/shopify-api';

import {
  createContract,
  deleteActiveShop,
  loadCurrentShop,
  updateContract,
  updateSubscriptionContractAfterFailure,
  updateSubscriptionContractAfterSuccess,
} from '../prisma-store.js';
import Logger from '../logger.js';

const AppWebhookHandlers: WebhookHandlersParam = {
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks',
    callback: async (_topic, shop, _body) => {
      // delete ACTIVE_SHOPIFY_SHOPS[shop];
      deleteActiveShop(shop);
    },
  },
  SUBSCRIPTION_CONTRACTS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks',
    callback: async (_topic, shop, body) => {
      Logger.log('info', `Subscription Contract Create Webhook`);
      const shopData = await loadCurrentShop(shop);
      if (shopData) {
        const token = shopData.accessToken;
        createContract(shop, token, body);
      }
    },
  },
  SUBSCRIPTION_CONTRACTS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks',
    callback: async (_topic, shop, body) => {
      Logger.log('info', `Subscription Contract Update Webhook`);
      const shopData = await loadCurrentShop(shop);
      console.log('SHOP DATA', shopData);
      if (shopData) {
        const token = shopData.accessToken;
        const success = await updateContract(shop, token, body);
        Logger.log('info', `Subscription Contract Update: ${success.id}`);
      }
    },
  },
  SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks',
    callback: async (_topic, shop, body) => {
      Logger.log('info', `Subscription Billing Attempt Success Webhook`);
      const shopData = await loadCurrentShop(shop);
      if (shopData) {
        const token = shopData.accessToken;
        updateSubscriptionContractAfterSuccess(shop, token, body);
      }
    },
  },
  SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/webhooks',
    callback: async (_topic, shop, body) => {
      Logger.log('info', `Subscription Billing Attempt Failure Webhook`);
      const shopData = await loadCurrentShop(shop);
      if (shopData) {
        const token = shopData.accessToken;
        const data = JSON.parse(body);
        const errorCodes = [
          'EXPIRED_PAYMENT_METHOD',
          'INVALID_PAYMENT_METHOD',
          'PAYMENT_METHOD_NOT_FOUND',
        ];
        if (
          data.errorCode === 'PAYMENT_METHOD_DECLINED' ||
          data.errorCode === 'AUTHENTICATION_ERROR' ||
          data.errorCode === 'UNEXPECTED_ERROR'
        ) {
          // will try again tomorrow
          updateSubscriptionContractAfterFailure(shop, token, body, false);
        } else {
          // get payment method id and send email
          updateSubscriptionContractAfterFailure(shop, token, body, true);
        }
        // Will more than likely create  an errors table to display error notifications to user.
        Logger.log('error', JSON.stringify(body));
      }
    },
  },
};

export default AppWebhookHandlers;
