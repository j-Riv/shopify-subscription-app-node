import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, Express } from 'express';
import {
  getAllSubscriptionGroups,
  addProductToSubscriptionPlanGroup,
  createSubscriptionPlanGroup,
  editSubscriptionPlanGroup,
  removeProductFromSubscriptionPlanGroup,
  deleteSubscriptionPlanGroup,
  getSubscriptionGroup,
} from '../controllers/subscriptions.js';

dotenv.config();

const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-suavescribe-token'];
  if (!token) return res.status(401);
  try {
    // decode
    const decoded: any = jwt.verify(token as string, process.env.SHOPIFY_API_SECRET!, {
      complete: true,
    });
    // set shop
    req.query.shop = decoded.payload.dest.replace(/https:\/\//, '');
    return next();
  } catch (err: any) {
    console.log('Error in verifyJwt', err.message);
    return res.status(401);
  }
};

const subscriptionRoutes = (app: Express) => {
  // Extension routes
  app.post('/subscription-plan/all', verifyJwt, getAllSubscriptionGroups);

  app.post('/subscription-plan/get', verifyJwt, getSubscriptionGroup);

  app.post('/subscription-plan/product/add', verifyJwt, addProductToSubscriptionPlanGroup);

  app.post('/subscription-plan/create', verifyJwt, createSubscriptionPlanGroup);
  // update subscripiton extension, then remove
  app.post('/subscription-plan/v2/create', verifyJwt, createSubscriptionPlanGroup);

  app.post('/subscription-plan/edit', verifyJwt, editSubscriptionPlanGroup);

  app.post('/subscription-plan/product/remove', verifyJwt, removeProductFromSubscriptionPlanGroup);

  app.post('/subscription-plan/delete', verifyJwt, deleteSubscriptionPlanGroup);
};

export default subscriptionRoutes;
