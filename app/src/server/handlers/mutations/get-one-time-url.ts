import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req, Response } from 'express';

interface Request extends Req {
  client: any;
}

export function ONETIME_CREATE(url: string) {
  return gql`
    mutation {
      appPurchaseOneTimeCreate(
        name: "test"
        price: { amount: 10, currencyCode: USD }
        returnUrl: "${url}"
        test: true
      ) {
        userErrors {
          field
          message
        }
        confirmationUrl
        appPurchaseOneTime {
          id
        }
      }
    }
  `;
}

interface Data {
  data: {
    appPurchaseOneTimeCreate: {
      confirmationUrl: string;
      appPurchaseOneTime: {
        id: string;
      };
    };
  };
}

export const getOneTimeUrl = async (req: Request, res: Response) => {
  const { client } = req;
  const confirmationUrl = await client
    .mutate({
      mutation: ONETIME_CREATE(process.env.HOST!),
    })
    .then((response: Data) => response.data.appPurchaseOneTimeCreate.confirmationUrl);
  return res.redirect(confirmationUrl);
};
