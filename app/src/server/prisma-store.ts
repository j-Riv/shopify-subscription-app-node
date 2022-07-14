import dotenv from 'dotenv';
import {
  createClient,
  getSubscriptionContract,
  getSubscriptionContracts,
  updateSubscriptionContract,
  updateSubscriptionDraft,
  commitSubscriptionDraft,
  updatePaymentMethod,
} from './handlers/index.js';
import { ApolloClient } from '@apollo/client';
import {
  generateNextBillingDate,
  generateNewBillingDate,
  sendMailGunPaymentFailure,
} from './utils/index.js';
import Logger from './logger.js';
import { Prisma, PrismaClient } from '@prisma/client';
dotenv.config();

const prisma = new PrismaClient();

export const loadActiveShops = async () => {
  interface Shops {
    [key: string]: {
      shop: string;
      scope: string;
    };
  }

  const allActiveShops = await prisma.activeShops.findMany();
  const shops: Shops = {};
  allActiveShops.forEach((shop) => {
    shops[shop.id] = {
      shop: shop.id,
      scope: shop.scope,
    };
  });
  return shops;
};

export const loadCurrentShop = async (name: string) => {
  const currentShop = await prisma.activeShops.findUnique({
    where: {
      id: name,
    },
  });

  if (currentShop) {
    return {
      shop: currentShop.id,
      scope: currentShop.scope,
      accessToken: currentShop.accessToken,
    };
  } else {
    return undefined;
  }
};

export const deleteActiveShop = async (name: string) => {
  Logger.log('info', `Deleting active shop: ${name}`);
  const deletedShop = await prisma.activeShops.delete({
    where: {
      id: name,
    },
  });

  if (deletedShop) {
    return true;
  } else {
    return false;
  }
};

export const storeActiveShop = async (data: {
  shop: string;
  scope: string;
  accessToken: string;
}) => {
  const { shop, scope, accessToken } = data;

  const upsertShop = await prisma.activeShops.upsert({
    where: {
      id: shop,
    },
    update: {
      id: shop,
      scope: scope,
      accessToken: accessToken,
    },
    create: {
      id: shop,
      scope: scope,
      accessToken: accessToken,
    },
  });

  return upsertShop;
};

export const getLocalContract = async (id: string) => {
  const contract = await prisma.subscriptionContracts.findUnique({
    where: {
      id: id,
    },
  });

  return contract ? contract : false;
};

export const createLocalContract = async (shop: string, contract: any) => {
  try {
    Logger.log('info', `Creating Local Contract: ${contract.id}`);
    // get interval and interval count
    const interval = contract.billingPolicy.interval;
    const intervalCount = contract.billingPolicy.intervalCount;

    const createContract = await prisma.subscriptionContracts.create({
      data: {
        id: contract.id,
        shop: shop,
        status: contract.status,
        nextBillingDate: contract.nextBillingDate,
        interval: interval,
        intervalCount: intervalCount,
        contract: contract,
      },
    });

    return createContract;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const updateLocalContract = async (shop: string, contract: any) => {
  try {
    Logger.log('info', `Updating Local Contract: ${contract.id}`);
    // get interval and interval count
    const interval = contract.billingPolicy.interval;
    const intervalCount = contract.billingPolicy.intervalCount;

    const updateContract = await prisma.subscriptionContracts.upsert({
      where: {
        id: contract.id,
      },
      update: {
        id: contract.id,
        shop: shop,
        status: contract.status,
        nextBillingDate: contract.nextBillingDate,
        interval: interval,
        intervalCount: intervalCount,
        contract: contract,
      },
      create: {
        id: contract.id,
        shop: shop,
        status: contract.status,
        nextBillingDate: contract.nextBillingDate,
        interval: interval,
        intervalCount: intervalCount,
        contract: contract,
      },
    });

    return updateContract;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const updateLocalContractPaymentFailure = async (
  shop: string,
  id: string,
  reset: boolean,
) => {
  let contract: Prisma.SubscriptionContractsUpdateInput;
  if (reset) {
    contract = {
      paymentFailureCount: 0,
    };
  } else {
    contract = {
      paymentFailureCount: { increment: 1 },
    };
  }

  const updateContract = await prisma.subscriptionContracts.update({
    where: {
      id: id,
    },
    data: contract,
  });

  return updateContract;
};

export const getLocalContractsByShop = async (shop: string) => {
  try {
    const today = new Date().toISOString().substring(0, 10) + 'T00:00:00Z';
    Logger.log('info', `Gettting all contracts for shop: ${shop}`);

    const localContracts = await prisma.subscriptionContracts.findMany({
      where: {
        AND: {
          shop: shop,
          nextBillingDate: today,
          status: {
            equals: 'ACTIVE',
          },
          paymentFailureCount: {
            lt: 2,
          },
        },
      },
    });

    return localContracts;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const getLocalContractsRenewingSoonByShop = async (
  shop: string,
  nextBillingDate: string,
) => {
  try {
    Logger.log('info', `Gettting all contracts for shop: ${shop}`);

    const localContracts = await prisma.subscriptionContracts.findMany({
      where: {
        AND: {
          shop: shop,
          nextBillingDate: nextBillingDate,
          status: {
            equals: 'ACTIVE',
          },
          paymentFailureCount: {
            lt: 2,
          },
        },
      },
    });

    return localContracts;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const getLocalContractsWithPaymentFailuresByShop = async (shop: string) => {
  try {
    Logger.log('info', `Gettting all contracts for shop: ${shop} with 2 or more payment failures`);

    const localContracts = await prisma.subscriptionContracts.findMany({
      where: {
        AND: {
          shop: shop,
          status: {
            equals: 'ACTIVE',
          },
          paymentFailureCount: {
            gte: 2,
          },
        },
      },
    });

    return localContracts;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

// webhooks
export const createContract = async (shop: string, token: string, body: any) => {
  body = JSON.parse(body);

  try {
    Logger.log('info', `Creating Contract`);
    const client: ApolloClient<unknown> = createClient(shop, token);
    const contract = await getSubscriptionContract(client, body.admin_graphql_api_id);

    const localContract = await createLocalContract(shop, contract);

    return localContract ? localContract : false;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const updateContract = async (shop: string, token: string, body: any) => {
  body = JSON.parse(body);
  const id = body.admin_graphql_api_id;

  try {
    Logger.log('info', `Updating Contract: ${id}`);
    const exists = await getLocalContract(id);
    const client: ApolloClient<unknown> = createClient(shop, token);
    const contract = await getSubscriptionContract(client, body.admin_graphql_api_id);
    let res: any;
    if (exists) {
      const paymentFailureCount = exists.paymentFailureCount;
      const status = exists.status;
      if (status === 'CANCELLED' && contract.status === 'ACTIVE') {
        await updateLocalContractPaymentFailure(shop, id, true);
      }
      res = await updateLocalContract(shop, contract);
    } else {
      res = await createLocalContract(shop, contract);
    }
    return res ? res : false;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

/* 
  Updates the Next Billing Date based on the interval and interval count.
  Checks to see if the contract exists locally (it should, but just to be safe).
  The Update Contract Webhook will trigger after this and Update the local database.
*/
export const updateSubscriptionContractAfterSuccess = async (
  shop: string,
  token: string,
  body: any,
) => {
  body = JSON.parse(body);
  const id = body.admin_graphql_api_subscription_contract_id;

  try {
    Logger.log('info', `Updating Next Billing Date: ${id}`);
    // create apollo client
    const client: ApolloClient<unknown> = createClient(shop, token);
    // check if contract exists
    let localContract = await getLocalContract(id);
    let contract: {
      interval: any;
      intervalCount: any;
      id?: string;
      shop?: string;
      status?: string;
      nextBillingDate?: Date;
      paymentFailureCount?: number;
      contract?: Prisma.JsonValue;
    };
    // if it doesnt get it from Shopify and insert into database
    if (!localContract) {
      const res = await getSubscriptionContract(client, id);
      contract = (await createLocalContract(shop, res)) as any;
    } else {
      Logger.log('info', `Contract exits lets update it: ${id}`);
      contract = localContract;
      // update paymen method failure
      await updateLocalContractPaymentFailure(shop, id, true);
    }
    // interval
    const interval = contract.interval;
    const intervalCount = contract.intervalCount;
    // generate next billing date
    const nextBillingDate = generateNextBillingDate(
      interval as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
      intervalCount,
    );
    Logger.log(
      'info',
      `Interval -> ${interval} Count -> ${intervalCount} Next Billing Date -> ${nextBillingDate}`,
    );
    // update next billing date on shopify get results use results to update local db.
    // get draft id
    const draftId = await updateSubscriptionContract(client, id);
    Logger.log('info', `Draft Id: ${draftId}`);
    // create input & update draft
    const input = {
      nextBillingDate: nextBillingDate,
    };
    const updatedDraftId = await updateSubscriptionDraft(client, draftId, input);
    Logger.log('info', `Updated Draft Id: ${updatedDraftId}`);
    // commit changes to draft
    const contractId = await commitSubscriptionDraft(client, updatedDraftId);
    Logger.log('info', `Contract Id: ${contractId}`);
    return contractId;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

/* 
  Updates the Next Billing Date after a payment failure.
  Checks to see if the contract exists locally (it should, but just to be safe).
  The Update Contract Webhook will trigger after this and Update the local database.
*/
export const updateSubscriptionContractAfterFailure = async (
  shop: string,
  token: string,
  body: any,
  updatePayment: boolean,
) => {
  body = JSON.parse(body);
  const id = body.admin_graphql_api_subscription_contract_id;

  try {
    Logger.log(
      'info',
      `Updating Next Billing Date After Payment Failure: ${id}, Send Update Payment Email: ${updatePayment}`,
    );
    // create apollo client
    const client: ApolloClient<unknown> = createClient(shop, token);
    // check if contract exists
    let contract = await getLocalContract(id);
    // if it doesnt get it from Shopify and insert into database
    if (!contract) {
      const res = await getSubscriptionContract(client, id);
      contract = (await createLocalContract(shop, res)) as any;
    } else {
      Logger.log('info', `Contract exits lets update it: ${id}`);
      // update paymen method failure
      await updateLocalContractPaymentFailure(shop, id, false);
      if (updatePayment) {
        await updateSubscriptionPaymentMethod(shop, token, body);
      }
    }
    // generate next billing date
    const nextBillingDate = generateNewBillingDate();
    Logger.log('info', `Next Billing Date -> ${nextBillingDate}`);
    // update next billing date on shopify get results use results to update local db.
    // get draft id
    const draftId = await updateSubscriptionContract(client, id);
    Logger.log('info', `Draft Id: ${draftId}`);
    // create input & update draft
    const input = {
      nextBillingDate: nextBillingDate,
    };
    const updatedDraftId = await updateSubscriptionDraft(client, draftId, input);
    Logger.log('info', `Updated Draft Id: ${updatedDraftId}`);
    // commit changes to draft
    const subscriptionContract = await commitSubscriptionDraft(client, updatedDraftId);
    Logger.log('info', `Contract Id: ${subscriptionContract.id}`);
    // send email notification
    const email = subscriptionContract.customer.email;
    const firstName = subscriptionContract.customer.firstName;
    await sendMailGunPaymentFailure(shop, email, firstName, nextBillingDate);

    return subscriptionContract.id;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

const updateSubscriptionPaymentMethod = async (shop: string, token: string, body: any) => {
  body = JSON.parse(body);
  const id = body.admin_graphql_api_subscription_contract_id;
  try {
    // create apollo client
    const client: ApolloClient<unknown> = createClient(shop, token);
    const res = await getSubscriptionContract(client, id);
    const paymentMethodId = res.customerPaymentMethod.id;
    const customerId = await updatePaymentMethod(client, paymentMethodId);
    return customerId;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const getSubscriptionsByStatus = async (shop: string, body: string) => {
  const data = JSON.parse(body);
  const { status } = data;
  try {
    Logger.log('info', `Getting all contracts by status: ${status}.`);

    const contracts = await prisma.subscriptionContracts.findMany({
      where: {
        AND: {
          shop: shop,
          status: status,
        },
      },
    });

    return contracts;
    // create apollo client
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const saveAllContracts = async (shop: string, token: string) => {
  try {
    Logger.log('info', `Saving all contracts.`);
    // create apollo client
    const client: ApolloClient<unknown> = createClient(shop, token);
    const moveAlong = async (after?: string) => {
      const variables: {
        first: number;
        after?: string;
      } = {
        first: 3,
      };
      if (after) {
        variables.after = after;
      }
      // get
      const res = await getSubscriptionContracts(client, variables);
      // save
      let cursor: string = '';
      for (let i = 0; i < res.edges.length; i++) {
        const contract = res.edges[i];

        await updateLocalContract(shop, contract.node);

        cursor = contract.cursor;
      }
      if (res.pageInfo.hasNextPage) {
        moveAlong(cursor);
      } else {
        return { success: true };
      }
    };

    const getContracts = () => {
      return new Promise((resolve, reject) => {
        const moveAlong = async (after?: string) => {
          const variables: {
            first: number;
            after?: string;
          } = {
            first: 3,
          };
          if (after) {
            variables.after = after;
          }
          // get
          const res = await getSubscriptionContracts(client, variables);
          // save
          let cursor: string = '';
          for (let i = 0; i < res.edges.length; i++) {
            const contract = res.edges[i];

            await updateLocalContract(shop, contract.node);

            cursor = contract.cursor;
          }
          if (res.pageInfo.hasNextPage) {
            moveAlong(cursor);
          } else {
            resolve({ success: true });
          }
        };
        moveAlong();
      });
    };
    // moveAlong();

    const done = await getContracts();
    return done;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};

export const getAllPaymentFailures = async (shop: string) => {
  try {
    const paymentFailures = await prisma.subscriptionContracts.findMany({
      where: {
        AND: {
          shop: shop,
          status: 'ACTIVE',
          contract: {
            path: ['lastPaymentStatus'],
            equals: 'FAILED',
          },
        },
      },
    });

    return paymentFailures;
  } catch (err: any) {
    Logger.log('error', err.message);
  }
};
