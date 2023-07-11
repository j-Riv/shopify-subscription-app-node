// @ts-check
import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { type Session, DeliveryMethod, Shopify } from '@shopify/shopify-api';
import expressServeStaticGzip from 'express-static-gzip';

import shopify from './shopify.js';
// Import Middleware
import updateShopDataMiddleware from './middleware/shopData.js';
// import Webhooks
import GDPRWebhookHandlers from './webhooks/gdprHandlers.js';
import AppWebhookHandlers from './webhooks/appHandlers.js';

import {
  getSubscriptionsByStatus,
  getAllPaymentFailures,
  saveAllContracts,
} from './prisma-store.js';
import Logger from './logger.js';

// Import Routes
import subscriptionRoutes from './routes/subscriptions.js';
import proxyRoutes from './routes/proxy.js';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '8081', 10);

const STATIC_PATH = `${process.cwd()}/dist/client`;

// const ACTIVE_SHOPIFY_SHOPS = await loadActiveShops();

const app = express();

// Set up Shopify authentication
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  updateShopDataMiddleware(app),
  shopify.redirectToShopifyOrAppRoot(),
);

// Set up Shopify webhooks handling
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers }),
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: AppWebhookHandlers }),
);

// init scheduler
// scheduler();

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

// Unauthenticated routes
// app.use('/api/billing', billingUnauthenticatedRoutes);

app.use(express.json());
subscriptionRoutes(app);
proxyRoutes(app, shopify);

// All endpoints after this point will require an active session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
  const session: Session = res.locals?.shopify?.session;
  const shop = session?.shop;
  console.log('-->', req.baseUrl + req.path, '| { shop: ' + shop + ' }');
  return next();
});

// app.use(express.json());

app.post('/api/graphql', async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const response = await shopify.api.clients.graphqlProxy({
      session: res.locals.shopify.session,
      // @ts-ignore
      rawBody: req.body, // From my app
    });
    res.status(200).send(response.body);
  } catch (error) {
    console.log('ERROR', error.message);
    res.status(500).send(error.message);
  }
});

// routes
// subscriptionRoutes(app);
// proxyRoutes(app, shopify);

// move
app.get('/api/sync', async (req, res, next) => {
  const session = res?.locals.shopify.session;
  const { shop, accessToken } = session;
  try {
    Logger.log('info', `Syncing contracts for shop: ${shop}`);
    const response = await saveAllContracts(shop, accessToken);
    res.status(200).json(response);
  } catch (err: any) {
    Logger.log('error', err.message);
  }
});

app.post('/api/contracts-by-status', async (req, res, next) => {
  const session = res?.locals.shopify.session;
  const { shop, accessToken } = session;
  try {
    Logger.log('info', `getting all contracts for shop: ${shop}`);
    const response = await getSubscriptionsByStatus(shop, JSON.stringify(req.body));
    res.status(200).json(response);
  } catch (err: any) {
    Logger.log('error', err.message);
  }
});

app.get('/api/payment-failed', async (req, res, next) => {
  const session = res?.locals.shopify.session;
  const { shop } = session;
  const contracts = await getAllPaymentFailures(shop);
  res.status(200).json({ contracts });
});
// end move

app.use(shopify.cspHeaders());
app.use(
  expressServeStaticGzip(STATIC_PATH, {
    enableBrotli: true,
    index: false,
    orderPreference: ['br', 'gz'],
  }),
);

// Reply to health check to let server know we are ready
app.use('/health', (_req, res) => {
  res.status(200).send();
});

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT);
console.log(`App running on port: ${PORT} ...`);
