import type { Express, Request, Response, NextFunction } from 'express';
import { storeActiveShop } from '../prisma-store.js';

export default function updateShopDataMiddleware(app: Express) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const { session } = res.locals.shopify;
    // Update db and mark shop as active
    console.log('STORE SESSION', session);
    storeActiveShop({
      shop: session.shop,
      scope: session.scope,
      accessToken: session.accessToken,
    });
    return next();
  };
}
