import dotenv from 'dotenv';
import schedule from 'node-schedule';
import {
  loadActiveShops,
  loadCurrentShop,
  getLocalContractsByShop,
  getLocalContractsRenewingSoonByShop,
  getLocalContractsWithPaymentFailuresByShop,
  saveAllContracts,
} from './prisma-store.js';
import 'isomorphic-fetch';
import {
  createClient,
  createSubscriptionBillingAttempt,
  getSubscriptionContract,
  updateSubscriptionContract,
  updateSubscriptionDraft,
  commitSubscriptionDraft,
  getProductVariantById,
  getDefaultLocation,
} from './handlers/index.js';
import { sendMailGunPause, sendMailGunRenew } from './utils/index.js';
import Logger from './logger.js';
import { SubscriptionContract, SubscriptionLine } from './types/subscriptions';
dotenv.config();

// globals
const RENEWAL_NOTIFICATION_DAYS = 5;

export const scheduler = () => {
  runBillingAttempts();
  // Logger.log('info', `Scheduler initialized ...`);
  const every10sec = '*/10 * * * *'; // every 10 seconds for testing
  const everymin = '*/1 * * * *'; // every min
  const everyday3am = '0 0 3 * * *'; // every day at 1 am
  const everyday6am = '0 0 6 * * *'; // every day at 6 am
  const everyday10am = '0 0 10 * * *'; // every day at 10 am
  const everyday12am = '0 0 0 * * *'; // every day at 12 am
  const everyhour = '0 0 */2 * * *'; // every 2 hours

  const scheduleJob = schedule.scheduleJob(everyday6am, async function () {
    Logger.log('info', `Running Billing Attempt Rule: ${everyday6am}`);
    runBillingAttempts();
  });
  const syncJob = schedule.scheduleJob(everyhour, async function () {
    Logger.log('info', `Running Contract Sync Rule: ${everyhour}`);
    runSubscriptionContractSync();
  });

  const cleanupJob = schedule.scheduleJob(everyday3am, async function () {
    Logger.log('info', `Running Cleanup Sync Rule: ${everyday3am}`);
    runCancellation();
  });

  const renewalNotificationJob = schedule.scheduleJob(everyday10am, async function () {
    Logger.log('info', `Running Renewal Notification Sync Rule: ${everyday10am}`);
    runRenewalNotification();
  });
};

export const runBillingAttempts = async () => {
  Logger.log('info', `RUNNING BILLING ATTEMPTS`);

  // get active shopify stores
  const ACTIVE_SHOPIFY_SHOPS = await loadActiveShops();
  const shops = Object.keys(ACTIVE_SHOPIFY_SHOPS);
  // loop through active shops
  shops.forEach(async (shop: string) => {
    // get token
    const shopData = await loadCurrentShop(shop);
    const token = shopData.accessToken;
    // get all active contracts for shop
    const contracts = await getLocalContractsByShop(shop);
    if (contracts) {
      Logger.log('info', `FOUND ${contracts.length} TO BILL`);
      // loop through contracts
      contracts.forEach(async (contract) => {
        // create billing attempt
        try {
          const client = createClient(shop, token);
          // check billing date on shopify
          const shopifyContract: SubscriptionContract = await getSubscriptionContract(
            client,
            contract.id,
          );

          if (
            shopifyContract.nextBillingDate.split('T')[0] ===
            contract.nextBillingDate.toISOString().substring(0, 10)
          ) {
            // check if quantity exists
            const defaultLocation = await getDefaultLocation(client);
            const defaultLocationId = defaultLocation.id;

            let oosProducts: string[] = [];
            await Promise.all(
              shopifyContract.lines.edges.map(async (line: SubscriptionLine) => {
                Logger.log(
                  'info',
                  `CHECKING PRODUCT ${line.node.variantId}, AT LOCATION: ${defaultLocationId}`,
                );
                console.log(
                  `CHECKING PRODUCT ${line.node.variantId}, AT LOCATION: ${defaultLocationId}`,
                );
                const variantProduct = await getProductVariantById(
                  client,
                  line.node.variantId,
                  defaultLocationId,
                );
                const variantAvailable = variantProduct.inventoryItem.inventoryLevel.available;
                Logger.log(
                  'info',
                  `Variant: ${variantProduct.product.title}: ${JSON.stringify(variantAvailable)}`,
                );
                // const variantAvailable =
                //   variantProduct.inventoryItem.inventoryLevels.edges[0].node.available;
                Logger.log(
                  'info',
                  `CHECKING PRODUCT ${variantProduct.id}, quantity available: ${variantAvailable}, quantity needed: ${line.node.quantity}`,
                );
                console.log(
                  `CHECKING PRODUCT ${variantProduct.id}, quantity available: ${variantAvailable}, quantity needed: ${line.node.quantity}`,
                );
                if (variantAvailable <= line.node.quantity) {
                  Logger.log('info', `FOUND OUT OF STOCK ITEM ${variantProduct.product.title}`);
                  oosProducts.push(variantProduct.product.title);
                }
              }),
            );

            // create billing attempt
            console.log('OOS PRODUCTS', oosProducts);
            console.log('OOS PRODUCTS LENGTH', oosProducts.length);
            if (oosProducts.length === 0) {
              const billingAttempt = await createSubscriptionBillingAttempt(client, contract.id);
              Logger.log(
                'info',
                `Created Billing Attempt For ${contract.id}: ${billingAttempt.id}`,
              );
            } else {
              // pause subscription and send email
              // update subscription
              Logger.log('info', `Pausing Subscription Contract:  ${contract.id} due to OOS`);

              let draftId = await updateSubscriptionContract(client, contract.id);
              draftId = await updateSubscriptionDraft(client, draftId, {
                status: 'PAUSED',
              });
              const subscription = await commitSubscriptionDraft(client, draftId);
              // send email
              if (subscription.id === contract.id) {
                const email = shopifyContract.customer.email;
                Logger.log('info', `Sending OOS Email to: ${email} for Contract: ${contract.id}`);
                sendMailGunPause(shop, email, shopifyContract, oosProducts);
              }
            }
          }
        } catch (err: any) {
          Logger.log('error', err.message);
        }
      });
    }
  });
};

// export const runBillingAttempts = async () => {
//   console.log('RUNNING BILLING ATTEMPTS');
//   // get active shopify stores
//   const ACTIVE_SHOPIFY_SHOPS = await pgStorage.loadActiveShops();
//   const shops = Object.keys(ACTIVE_SHOPIFY_SHOPS);
//   // loop through active shops
//   shops.forEach(async (shop: string) => {
//     // get token
// const shopData = await pgStorage.loadCurrentShop(shop);
// const token = shopData.accessToken;
//     // get all active contracts for shop
//     const contracts = await pgStorage.getLocalContractsByShop(shop);
//     if (contracts) {
//       // loop through contracts
//       contracts.forEach(async contract => {
//         // create billing attempt
//         try {
//           const client = createClient(shop, token);
//           const billingAttempt = await createSubscriptionBillingAttempt(
//             client,
//             contract.id
//           );
//           Logger.log('info', `Created Billing Attempt: ${billingAttempt}`);
//         } catch (err: any) {
//           Logger.log('error', err.message);
//         }
//       });
//     }
//   });
// };

export const runRenewalNotification = async () => {
  Logger.log('info', `RUNNING RENEWEING SOON`);
  // get active shopify stores
  const ACTIVE_SHOPIFY_SHOPS = await loadActiveShops();
  const shops = Object.keys(ACTIVE_SHOPIFY_SHOPS);
  // loop through active shops
  shops.forEach(async (shop: string) => {
    // get token
    const shopData = await loadCurrentShop(shop);
    const token = shopData.accessToken;
    // get all active contracts for shop
    const now = new Date();
    now.setDate(now.getDate() + RENEWAL_NOTIFICATION_DAYS);
    const nextBillingDate = new Date(now).toISOString().split('T')[0] + 'T00:00:00Z';
    const contracts = await getLocalContractsRenewingSoonByShop(shop, nextBillingDate);
    if (contracts) {
      Logger.log('info', `FOUND ${contracts.length} RUNNING RENEWEING SOON`);
      // loop through contracts
      contracts.forEach(async (contract) => {
        // create billing attempt
        try {
          const client = createClient(shop, token);
          // check billing date on shopify
          const shopifyContract: SubscriptionContract = await getSubscriptionContract(
            client,
            contract.id,
          );

          // send mailgun
          await sendMailGunRenew(
            shop,
            shopifyContract.customer.email,
            shopifyContract.customer.firstName,
            shopifyContract.nextBillingDate,
          );
        } catch (err: any) {
          Logger.log('error', err.message);
        }
      });
    }
  });
};

export const runSubscriptionContractSync = async () => {
  Logger.log('info', `RUNNING SUBSCRIPTION CONTRACT SYNC`);
  // get active shopify stores
  const ACTIVE_SHOPIFY_SHOPS = await loadActiveShops();
  const shops = Object.keys(ACTIVE_SHOPIFY_SHOPS);
  shops.forEach(async (shop: string) => {
    try {
      Logger.log('info', `Syncing contracts for shop: ${shop}`);
      const shopData = await loadCurrentShop(shop);
      const token = shopData.accessToken;
      await saveAllContracts(shop, token);
      return { msg: true };
    } catch (err: any) {
      Logger.log('error', err.message);
    }
  });
};

export const runCancellation = async () => {
  Logger.log('info', `RUNNING CLEANUP`); // get active shopify stores
  const ACTIVE_SHOPIFY_SHOPS = await loadActiveShops();
  const shops = Object.keys(ACTIVE_SHOPIFY_SHOPS);
  // loop through active shops
  shops.forEach(async (shop: string) => {
    // get token
    const shopData = await loadCurrentShop(shop);
    const token = shopData.accessToken;
    // get all active contracts for shop
    const contracts = await getLocalContractsWithPaymentFailuresByShop(shop);
    if (contracts) {
      // loop through contracts
      contracts.forEach(async (contract) => {
        // if payment failures > 2 change status to cancelled.
        try {
          const client = createClient(shop, token);
          // get draft id
          const draftId = await updateSubscriptionContract(client, contract.id);
          Logger.log('info', `Draft Id: ${draftId}`);
          // create input & update draft
          const input = {
            status: 'CANCELLED',
          };
          const updatedDraftId = await updateSubscriptionDraft(client, draftId, input);
          Logger.log('info', `Updated Draft Id: ${updatedDraftId}`);
          // commit changes to draft
          const contractId = await commitSubscriptionDraft(client, updatedDraftId);
          Logger.log('info', `Contract Id: ${contractId}`);
        } catch (err: any) {
          Logger.log('error', err.message);
        }
      });
    }
  });
};
