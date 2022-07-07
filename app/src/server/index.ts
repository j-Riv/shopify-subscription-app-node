// @ts-check
import { resolve } from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Shopify, ApiVersion } from '@shopify/shopify-api';
import RedisStore from './redis-store.js';
import PgStore from './pg-store.js';
import Logger from './logger.js';
import { scheduler } from './scheduler.js';
import 'dotenv/config';

import applyAuthMiddleware from './middleware/auth.js';
import verifyRequest from './middleware/verify-request.js';
import { ViteDevServer } from 'vite';

// routes
import subscriptionRoutes from './routes/subscriptions.js';
import proxyRoutes from './routes/proxy.js';

const USE_ONLINE_TOKENS = true;
const TOP_LEVEL_OAUTH_COOKIE = 'shopify_top_level_oauth';

const PORT = parseInt(process.env.PORT || '8081', 10);
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;

// Create a new instance of the custom storage class
const sessionStorage = new RedisStore();
const pgStorage = new PgStore();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(','),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ''),
  API_VERSION: ApiVersion.April22,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  // SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
  // Pass the sessionStorage methods to pass into a new instance of `CustomSessionStorage`
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    sessionStorage.storeCallback.bind(sessionStorage),
    sessionStorage.loadCallback.bind(sessionStorage),
    sessionStorage.deleteCallback.bind(sessionStorage),
  ),
});

// Storing the currently active shops in memory will force them
// to re - login when your server restarts.You should
// persist this object in your app.
// const ACTIVE_SHOPIFY_SHOPS = {};
const ACTIVE_SHOPIFY_SHOPS = await pgStorage.loadActiveShops();
console.log('LOADING ACTIVE SHOPS FROM DB', ACTIVE_SHOPIFY_SHOPS);
Shopify.Webhooks.Registry.addHandler('APP_UNINSTALLED', {
  path: '/webhooks',
  webhookHandler: async (topic, shop, body) => {
    delete ACTIVE_SHOPIFY_SHOPS[shop];
    pgStorage.deleteActiveShop(shop);
  },
});

// init scheduler
scheduler();

// webhook handlers
Shopify.Webhooks.Registry.addHandler('SUBSCRIPTION_CONTRACTS_CREATE', {
  path: '/webhooks',
  webhookHandler: async (topic, shop, body) => {
    Logger.log('info', `Subscription Contract Create Webhook`);
    const shopData = await pgStorage.loadCurrentShop(shop);
    if (shopData) {
      const token = shopData.accessToken;
      pgStorage.createContract(shop, token, body);
    }
  },
});

Shopify.Webhooks.Registry.addHandler('SUBSCRIPTION_CONTRACTS_UPDATE', {
  path: '/webhooks',
  webhookHandler: async (topic, shop, body) => {
    Logger.log('info', `Subscription Contract Update Webhook`);
    const shopData = await pgStorage.loadCurrentShop(shop);
    if (shopData) {
      const token = shopData.accessToken;
      const success = await pgStorage.updateContract(shop, token, body);
      Logger.log('info', `Subscription Contract Update: ${success}`);
    }
  },
});

Shopify.Webhooks.Registry.addHandler('SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS', {
  path: '/webhooks',
  webhookHandler: async (topic, shop, body) => {
    Logger.log('info', `Subscription Billing Attempt Success Webhook`);
    const shopData = await pgStorage.loadCurrentShop(shop);
    if (shopData) {
      const token = shopData.accessToken;
      pgStorage.updateSubscriptionContractAfterSuccess(shop, token, body);
    }
  },
});

Shopify.Webhooks.Registry.addHandler('SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE', {
  path: '/webhooks',
  webhookHandler: async (topic, shop, body) => {
    Logger.log('info', `Subscription Billing Attempt Failure Webhook`);
    const shopData = await pgStorage.loadCurrentShop(shop);
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
        pgStorage.updateSubscriptionContractAfterFailure(shop, token, body, false);
      } else {
        // get payment method id and send email
        pgStorage.updateSubscriptionContractAfterFailure(shop, token, body, true);
      }
      // Will more than likely create  an errors table to display error notifications to user.
      Logger.log('error', JSON.stringify(body));
    }
  },
});

// export for test use only
export const createServer = async (
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
) => {
  const app = express();
  console.log('SETTING APP VALUES', ACTIVE_SHOPIFY_SHOPS);
  app.set('top-level-oauth-cookie', TOP_LEVEL_OAUTH_COOKIE);
  app.set('active-shopify-shops', ACTIVE_SHOPIFY_SHOPS);
  app.set('use-online-tokens', USE_ONLINE_TOKENS);
  console.log('APP SET', app.get('active-shopify-shops'));

  app.use(cookieParser(Shopify.Context.API_SECRET_KEY));

  app.use(cors());

  applyAuthMiddleware(app, pgStorage);

  app.post('/webhooks', async (req, res) => {
    try {
      await Shopify.Webhooks.Registry.process(req, res);
      console.log('Webhook processed, returned status code 200');
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
      if (!res.headersSent) {
        res.status(500).send(error.message);
      }
    }
  });

  app.get('/products-count', verifyRequest(app), async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);
    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );

    const countData = await Product.count({ session });
    res.status(200).send(countData);
  });

  app.post('/graphql', verifyRequest(app), async (req, res) => {
    try {
      const response = await Shopify.Utils.graphqlProxy(req, res);
      res.status(200).send(response.body);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.use(express.json());

  // routes
  subscriptionRoutes(app);
  proxyRoutes(app);

  // move
  app.post('/contracts-by-status', verifyRequest(app), async (req, res, next) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);
    const { shop, accessToken } = session;
    try {
      Logger.log('info', `getting all contracts for shop: ${shop}`);
      const response = await pgStorage.getSubscriptionsByStatus(shop, JSON.stringify(req.body));
      res.status(200).json(response);
    } catch (err: any) {
      Logger.log('error', err.message);
    }
  });

  app.get('/payment-failed', verifyRequest(app), async (req, res, next) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);
    const { shop } = session;
    const contracts = await pgStorage.getAllPaymentFailures(shop);
    res.status(200).json({ contracts });
  });
  // end move

  app.use((req, res, next) => {
    const { shop } = req.query;
    if (Shopify.Context.IS_EMBEDDED_APP && shop) {
      res.setHeader(
        'Content-Security-Policy',
        `frame-ancestors https://${shop} https://admin.shopify.com;`,
      );
    } else {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'none';");
    }
    next();
  });

  app.use('/*', (req, res, next) => {
    const query = req.query as Record<string, string>;
    const { shop } = query;

    // Detect whether we need to reinstall the app, any request from Shopify will
    // include a shop in the query parameters.
    console.log('ACTIVE_SHOPIFY_SHOPS', app.get('active-shopify-shops'));
    if (app.get('active-shopify-shops')[shop] === undefined && shop) {
      res.redirect(`/auth?${new URLSearchParams(query).toString()}`);
    } else {
      next();
    }
  });

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite: ViteDevServer;
  if (!isProd) {
    console.log('DEV SERVER');
    vite = await import('vite').then(({ createServer }) =>
      createServer({
        root,
        logLevel: isTest ? 'error' : 'info',
        server: {
          port: PORT,
          hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 64999,
            clientPort: 64999,
          },
          middlewareMode: 'html',
        },
      }),
    );
    app.use(vite.middlewares);
  } else {
    console.log('PROD SERVER');
    const compression = await import('compression').then(({ default: fn }) => fn);
    const serveStatic = await import('serve-static').then(({ default: fn }) => fn);
    const fs = await import('fs');
    app.use(compression());
    app.use(serveStatic(resolve('dist/client')));
    app.use('/*', (req, res, next) => {
      // Client-side routing will pick up on the correct
      // route to render, so we always render the index here
      res
        .status(200)
        .set('Content-Type', 'text/html')
        .send(fs.readFileSync(`${process.cwd()}/dist/client/index.html`));
    });
  }

  return { app, vite };
};

if (!isTest) {
  createServer().then(({ app }) => app.listen(PORT));
}
