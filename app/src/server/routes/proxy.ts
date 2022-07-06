import dotenv from 'dotenv';
import crypto from 'crypto';
import { Request, Response, NextFunction, Express } from 'express';
import fs from 'fs';
import {
  // applicationProxy,
  updateCustomerSubscription,
  updateSubscriptionPaymentMethod,
  generateCustomerAuth,
  getCustomerSubscriptions,
  liquidApplicationProxy,
  updateSubscriptionShippingAddress,
} from '../controllers/proxy.js';

dotenv.config();

const validateSignature = (req: Request, res: Response, next: NextFunction) => {
  const query = req.query;
  const parameters: string[] = [];
  for (let key in query) {
    if (key != 'signature') {
      parameters.push(key + '=' + query[key]);
    }
  }
  const message = parameters.sort().join('');
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
  console.log('DIGEST === QUERY.SIGNATURE', digest === query.signature);
  if (digest === query.signature) {
    console.log('SHOPIFY APP PROXY REQEST VERIFIED');
    return next();
  } else {
    return res.status(403);
  }
};

// App Proxy routes
const proxyRoutes = (app: Express) => {
  app.post('/app_proxy/subscription/edit', validateSignature, updateCustomerSubscription);

  app.post('/app_proxy/subscription/payment', validateSignature, updateSubscriptionPaymentMethod);

  app.post('/app_proxy/subscription/address', validateSignature, updateSubscriptionShippingAddress);

  // send react app as liquid
  app.get('/app_proxy', validateSignature, liquidApplicationProxy);
  // router.get('/app_proxy/', validateSignature, applicationProxy);

  app.get('/app_proxy/static/css/:file', (req: Request, res: Response) => {
    res.set('Content-Type', 'text/css');
    const readStream = fs.createReadStream(
      `${process.env.APP_PROXY}/build/static/css/${req.params.file}`,
    );
    readStream.pipe(res);
  });

  app.get('/app_proxy/static/js/:file', (req: Request, res: Response) => {
    res.set('Content-Type', 'text/javascript');
    const readStream = fs.createReadStream(
      `${process.env.APP_PROXY}/build/static/js/${req.params.file}`,
    );
    readStream.pipe(res);
  });

  app.post('/app_proxy/subscriptions', validateSignature, getCustomerSubscriptions);

  app.post('/app_proxy/auth', validateSignature, generateCustomerAuth);
};

export default proxyRoutes;
