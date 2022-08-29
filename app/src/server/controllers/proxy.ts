import dotenv from 'dotenv';
// import 'isomorphic-fetch';
import { Request as Req, Response, NextFunction } from 'express';
import { ApolloClient } from '@apollo/client';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import mailgun from 'mailgun-js';
import {
  commitSubscriptionDraft,
  createClient,
  getCustomerSubscriptionContractsById,
  // getSubscriptionContract,
  updateSubscriptionContract,
  updateSubscriptionDraft,
  updateSubscriptionDraftLine,
  removeSubscriptionDraftLine,
  updatePaymentMethod,
} from '../handlers/index.js';
import { loadCurrentShop } from '../prisma-store.js';
import { stringify } from 'uuid';
dotenv.config();

interface Request extends Req {
  client: ApolloClient<any>;
}

const readFileThunk = (src: string) => {
  return new Promise((resolve, reject) => {
    fs.readFile(src, { encoding: 'utf8' }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};

const verifyToken = (shop: string, customer_id: string, token: string) => {
  try {
    const decoded: any = jwt.verify(token, process.env.APP_PROXY_SECRET);
    if (decoded && decoded.customer_id === customer_id && decoded.shop === shop) {
      return true;
    }
  } catch (err: any) {
    console.log('ERROR VERIFYING TOKEN', err.message);
    return false;
  }
};

export const getCustomerSubscriptions = async (req: Request, res: Response) => {
  const params = req.query;
  const body = req.body as {
    customerId: string;
    token: string;
  };

  const { token, customerId } = body;
  if (customerId) {
    try {
      const shop = params.shop as string;
      if (shop && token) {
        const verified = verifyToken(shop, customerId, token);
        if (verified) {
          const pgRes = await loadCurrentShop(shop);
          if (pgRes) {
            req.client = createClient(shop, pgRes.accessToken);
            const subscriptions = await getCustomerSubscriptionContractsById(req, customerId);
            if (subscriptions.length > 0) {
              res.json(subscriptions);
            } else {
              res.json({ msg: 'No Subs Found' });
            }
          } else {
            return res.status(403);
          }
        } else {
          res.status(403).redirect('/accounts');
        }
      }
    } catch (err: any) {
      console.log('ERROR', err.message);
      return res.status(403);
    }
  } else {
    res.send(`
      <a href="/apps/app_proxy/?customerId={{ customer.id}}">View Subscriptions</a>
    `);
  }
};

export const updateCustomerSubscription = async (req: Request, res: Response) => {
  const params = req.query;
  const body = req.body as {
    token: string;
    customerId: string;
    shop: string;
    subscriptionContractId: string;
    status: string;
  };
  const { token, customerId, subscriptionContractId, status } = body;
  try {
    const shop = params.shop as string;
    if (shop && token) {
      const verified = verifyToken(shop, customerId, token);
      if (verified) {
        const pgRes = await loadCurrentShop(shop);
        if (pgRes) {
          const input: { status: string; nextBillingDate?: string } = {
            status: status,
          };
          // if re-activating subscription set next billing date
          if (status === 'ACTIVE') {
            // generate tomorrows date
            const today = new Date();
            today.setDate(today.getDate() + 2);
            const nextBillingDate = today.toISOString();
            input.nextBillingDate = nextBillingDate;
          }
          const client = createClient(shop, pgRes.accessToken);
          let draftId = await updateSubscriptionContract(client, subscriptionContractId);
          draftId = await updateSubscriptionDraft(client, draftId, input);
          const subscriptionId = await commitSubscriptionDraft(client, draftId);
          // send data
          res.json({ updatedSubscriptionContractId: subscriptionId });
        } else {
          return res.status(401);
        }
      }
    } else {
      res.status(403).redirect('/accounts');
    }
  } catch (err: any) {
    console.log('ERROR', err.message);
    return res.status(403);
  }
};

const calculateCurrentPrice = (discountRate: number, currentPrice: string) => {
  const price = parseFloat(currentPrice);
  const amount = (price - price * discountRate).toFixed(2);
  return String(amount);
};

export const updateCustomerSubscriptionLines = async (req: Request, res: Response) => {
  const params = req.query;
  const body = req.body as {
    token: string;
    customerId: string;
    shop: string;
    subscriptionContractId: string;
    lines: {
      id: string;
      quantity: number;
      basePrice: string;
    }[];
  };
  interface Line {
    id: string;
    quantity: number;
    basePrice: string;
    currentPrice: string;
  }

  const { token, customerId, subscriptionContractId, lines } = body;
  try {
    const shop = params.shop as string;
    if (shop && token) {
      const verified = verifyToken(shop, customerId, token);
      if (verified) {
        const pgRes = await loadCurrentShop(shop);
        if (pgRes) {
          // get new prices
          let totalQuantity: number = 0;
          lines.forEach((line: Line) => (totalQuantity += Number(line.quantity)));
          // move this to constant later
          let discountRate: number = 0;
          if (totalQuantity >= 5) {
            discountRate = 0.2;
          } else if (totalQuantity >= 4) {
            discountRate = 0.15;
          } else if (totalQuantity >= 3) {
            discountRate = 0.1;
          } else {
            discountRate = 0;
          }

          const linesWithUpdatedPrices = lines.map((el: Line) => {
            return {
              id: el.id,
              quantity: Number(el.quantity),
              currentPrice: calculateCurrentPrice(discountRate, el.basePrice),
              basePrice: el.basePrice,
            };
          });

          // create update draft
          const client = createClient(shop, pgRes.accessToken);
          let draftId = await updateSubscriptionContract(client, subscriptionContractId);
          // loop through lines and update lines with new current price
          const promises = linesWithUpdatedPrices.map(async (line: Line) => {
            if (line.quantity === 0) {
              return await removeSubscriptionDraftLine(client, draftId, line.id);
            } else {
              return await updateSubscriptionDraftLine(client, draftId, line.id, {
                currentPrice: line.currentPrice,
                quantity: line.quantity,
              });
            }
          });
          const updatedLines = await Promise.all(promises);
          // commit draft
          const subscriptionId = await commitSubscriptionDraft(client, draftId);
          // send data
          res.json({ updatedSubscriptionContractId: subscriptionId });
        } else {
          return res.status(401);
        }
      }
    } else {
      res.status(403).redirect('/accounts');
    }
  } catch (err: any) {
    console.log('ERROR', err.message);
    return res.status(403);
  }
};

export const updateSubscriptionPaymentMethod = async (req: Request, res: Response) => {
  const params = req.query;
  const body = req.body as {
    token: string;
    customerId: string;
    paymentMethodId: string;
  };
  const { token, customerId, paymentMethodId } = body;
  try {
    const shop = params.shop as string;
    if (shop && token) {
      const verified = verifyToken(shop, customerId, token);
      if (verified) {
        const pgRes = await loadCurrentShop(shop);
        if (pgRes) {
          const client = createClient(shop, pgRes.accessToken);
          const customerId = await updatePaymentMethod(client, paymentMethodId);
          // send data
          res.json({ customerId: customerId });
        } else {
          return res.status(401);
        }
      } else {
        res.status(403).redirect('/accounts');
      }
    }
  } catch (err: any) {
    console.log('ERROR', err.message);
    return res.status(403);
  }
};

export const updateSubscriptionShippingAddress = async (req: Request, res: Response) => {
  const params = req.query;
  const body = req.body as {
    token: string;
    customerId: string;
    subscriptionContractId: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    firstName: string;
    lastName: string;
    company: string;
    phone: string;
  };
  const {
    token,
    customerId,
    subscriptionContractId,
    address1,
    address2,
    city,
    province,
    country,
    zip,
    firstName,
    lastName,
    company,
    phone,
  } = body;
  try {
    const shop = params.shop as string;
    if (shop && token) {
      const verified = verifyToken(shop, customerId, token);
      if (verified) {
        const pgRes = await loadCurrentShop(shop);
        if (pgRes) {
          const client = createClient(shop, pgRes.accessToken);
          let draftId = await updateSubscriptionContract(client, subscriptionContractId);
          draftId = await updateSubscriptionDraft(client, draftId, {
            deliveryMethod: {
              shipping: {
                address: {
                  address1,
                  address2,
                  city,
                  province,
                  country,
                  zip,
                  firstName,
                  lastName,
                  company,
                  phone,
                },
              },
            },
          });
          if (typeof draftId !== 'string') {
            return res.json({ errors: draftId });
          }
          const subscriptionId = await commitSubscriptionDraft(client, draftId);
          // send data
          res.json({ updatedSubscriptionContractId: subscriptionId });
        } else {
          return res.status(401);
        }
      } else {
        res.status(403).redirect('/accounts');
      }
    }
  } catch (err: any) {
    console.log('ERROR', err.message);
    return res.status(403);
  }
};

const sendMailGun = async (shop: string, email: string, link: string) => {
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });
  const data = {
    from: `${process.env.MAILGUN_SENDER} <no-reply@${process.env.MAILGUN_DOMAIN}>`,
    to: `${email}`,
    bcc: `${process.env.MAILGUN_ADMIN_EMAIL}`,
    subject: 'Subscription Authorization Link',
    html: `
      <p>Hello,<br>Below is your secure login link:</p>
      <p><a href="${link}">Manage Subscriptions</a></p>
      <p>This link will expire in 60 minutes. To generate a new link please log into your <a href="https://${shop}/account">account</a> and select Manage Subscriptions.</p>
    `,
  };
  mg.messages().send(data, function (error, body) {
    if (error) console.error('ERROR', error);
    console.log('MAILGUN RESPONSE', body);
    return body.message;
  });
};

export const generateCustomerAuth = async (req: Request, res: Response) => {
  // get customer id from body
  const params = req.query;
  const body = req.body as {
    customerId: string;
    customerEmail: string;
  };
  if (body.customerId && params.shop) {
    // generate auth token
    const shop = params.shop as string;
    const customer_id = body.customerId as string;
    const customer_email = body.customerEmail as string;
    const token = jwt.sign(
      {
        shop: shop,
        customer_id: customer_id,
      },
      process.env.APP_PROXY_SECRET,
      { expiresIn: '60m' },
    );
    const url = `https://${shop}/apps/app_proxy?shop=${shop}&customer_id=${customer_id}&token=${token}`;
    // generate email
    // disabled since we now just redirect with jwt
    // const emailResponse = await sendMailGun(shop, customer_email, url);
    res.status(200).json({ url: url });
  } else {
    console.log('NO SHOP OR CUSTOMER ID SUPPLIED');
    res.json({ error: 'No Shop or Customer ID Supplied' });
  }
};

const verificationFailure = `
  <div style="text-align:center;">
    <p>ERROR: Verification Failed</p>
    <p><a href="/account">Go Back to Account</a></p>
  </div>
`;

export const liquidApplicationProxy = async (req: Request, res: Response) => {
  const params = req.query;
  if (params.token && params.shop && params.customer_id) {
    const token = params.token as string;
    const shop = params.shop as string;
    const customer_id = params.customer_id as string;
    const verified = verifyToken(shop, customer_id, token);
    res.set('Content-Type', 'application/liquid');
    if (verified) {
      const app = await readFileThunk(`${process.env.APP_PROXY}/build/index.html`);
      res.send(`
        {% if customer %}
          {% if customer.id == ${params.customer_id} %}
            ${app}
          {% else %}
          <div style="text-align: center;">
            <p>Something went wrong ...</p>
            <p><a href="/account">Go Back to Account</a></p>
          </div>
          {% endif %}
        {% else %}
        <p>Please Login!</p>
        {% endif %}
      `);
    } else {
      res.send(verificationFailure);
    }
  } else {
    console.log('ERROR', 'Missing Token, Shop or Customer Id.');
    res.send(verificationFailure);
  }
};

export const applicationProxy = async (req: Request, res: Response) => {
  const params = req.query;
  if (params.token && params.shop && params.customer_id) {
    const token = params.token as string;
    const shop = params.shop as string;
    const customer_id = params.customer_id as string;
    const verified = verifyToken(shop, customer_id, token);
    if (verified) {
      res.set('Content-Type', 'text/html');
      const readStream = fs.createReadStream(`${process.env.APP_PROXY}/build/index.html`);
      readStream.pipe(res);
    } else {
      res.set('Content-Type', 'application/liquid');
      res.send(verificationFailure);
    }
  } else {
    console.log('ERROR', 'Missing Token, Shop or Customer Id.');
    res.send(verificationFailure);
  }
};
