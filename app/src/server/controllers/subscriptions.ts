import dotenv from 'dotenv';
import Shopify from '@shopify/shopify-api';
import { Request as Req, Response, NextFunction } from 'express';
import { ApolloClient } from '@apollo/client';
// import 'isomorphic-fetch';
import {
  addProductToSellingPlanGroups,
  removeProductsFromSellingPlanGroup,
  addProductVariantToSellingPlanGroups,
  removeProductVariantFromSellingPlanGroups,
  createClient,
  createSellingPlanGroup,
  createSellingPlanGroupV2,
  updateSellingPlanGroup,
  deleteSellingPlanGroup,
  getSellingPlans,
  getSellingPlanById,
} from '../handlers/index.js';
import { loadCurrentShop } from '../prisma-store.js';
import logger from '../logger.js';
dotenv.config();

interface Request extends Req {
  client: ApolloClient<any>;
}

export const getAllSubscriptionGroups = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      req.client = createClient(shop, pgRes.accessToken);
      const plans = await getSellingPlans(req);
      res.json(plans);
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err);
    return res.status(500);
  }
};

export const getSubscriptionGroup = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      req.client = createClient(shop, pgRes.accessToken);
      const plan = await getSellingPlanById(req);
      res.json(plan);
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};

export const addProductToSubscriptionPlanGroup = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      const body = req.body as {
        productId: string;
        variantId?: string;
        selectedPlans: string[];
      };
      req.client = createClient(shop, pgRes.accessToken);
      let product: any;
      if (body.variantId) {
        product = await addProductVariantToSellingPlanGroups(req);
      } else {
        product = await addProductToSellingPlanGroups(req);
      }
      res.json(product);
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};

export const createSubscriptionPlanGroup = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      req.client = createClient(shop, pgRes.accessToken);
      const id = await createSellingPlanGroup(req);
      res.json({ id });
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};

export const createSubscriptionPlanGroupV2 = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      req.client = createClient(shop, pgRes.accessToken);
      const response = await createSellingPlanGroupV2(req);
      res.json(response);
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};

export const editSubscriptionPlanGroup = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      req.client = createClient(shop, pgRes.accessToken);
      const id = await updateSellingPlanGroup(req);
      res.json({ id });
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};

export const removeProductFromSubscriptionPlanGroup = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      const body = req.body as {
        productId: string;
        variantId?: string;
        selectedPlans: string[];
      };
      req.client = createClient(shop, pgRes.accessToken);
      let product: any;
      if (body.variantId) {
        product = await removeProductVariantFromSellingPlanGroups(req);
      } else {
        product = await removeProductsFromSellingPlanGroup(req);
      }
      // const products = await removeProductsFromSellingPlanGroup(ctx);
      res.json(product);
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};

export const deleteSubscriptionPlanGroup = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as unknown as string;
    // this will have to call db and get accessToken
    const pgRes = await loadCurrentShop(shop);
    if (pgRes) {
      req.client = createClient(shop, pgRes.accessToken);
      const id = await deleteSellingPlanGroup(req);
      res.json({ id });
    } else {
      return res.status(401);
    }
  } catch (err: any) {
    logger.log('error', err.message);
    return res.status(500);
  }
};
