import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req, Response } from 'express';

interface Request extends Req {
  client: any;
}

export function RECURRING_CREATE(url: string) {
  return gql`
    mutation {
      appSubscriptionCreate(
          name: "Super Duper Plan"
          returnUrl: "${url}"
          test: true
          lineItems: [
          {
            plan: {
              appUsagePricingDetails: {
                  cappedAmount: { amount: 10, currencyCode: USD }
                  terms: "$1 for 1000 emails"
              }
            }
          }
          {
            plan: {
              appRecurringPricingDetails: {
                  price: { amount: 10, currencyCode: USD }
              }
            }
          }
          ]
        ) {
            userErrors {
              field
              message
            }
            confirmationUrl
            appSubscription {
              id
            }
        }
    }`;
}

export const getSubscriptionUrl = async (req: Request, res: Response) => {
  const { client } = req;
  const confirmationUrl = await client
    .mutate({
      mutation: RECURRING_CREATE(process.env.HOST!),
    })
    .then(
      (response: {
        data: {
          appSubscriptionCreate: {
            confirmationUrl: string;
            appSubscription: {
              id: string;
            };
          };
        };
      }) => response.data.appSubscriptionCreate.confirmationUrl,
    );

  return res.redirect(confirmationUrl);
};
