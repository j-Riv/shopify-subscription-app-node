import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}
export function TEST_PRODUCT_CREATE() {
  return gql`
    mutation exampleProductCreate($input: ProductInput!) {
      productCreate(input: $input) {
        userErrors {
          field
          message
        }
        product {
          id
          title
          productType
        }
      }
    }
  `;
}

interface Data {
  data: {
    productCreate: {
      product: {
        id: string;
        title: string;
        productType: string;
      };
    };
  };
}

export const createTestProduct = async (req: Request): Promise<Data> => {
  const { client } = req;
  const testProduct = await client
    .mutate({
      mutation: TEST_PRODUCT_CREATE(),
      variables: {
        input: { title: 'test product', productType: 'test type' },
      },
    })
    .then((response: Data) => {
      return response.data;
    });

  return testProduct;
};
