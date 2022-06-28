import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_REMOVE_PRODUCT() {
  return gql`
    mutation sellingPlanGroupRemoveProducts($id: ID!, $productIds: [ID!]!) {
      sellingPlanGroupRemoveProducts(id: $id, productIds: $productIds) {
        userErrors {
          field
          message
        }
        removedProductIds
      }
    }
  `;
}

export const removeProductsFromSellingPlanGroup = async (req: Request) => {
  const { client } = req;
  const body = req.body as {
    sellingPlanGroupId: string;
    productId: string;
  };
  const { sellingPlanGroupId, productId } = body;
  const variables = {
    id: sellingPlanGroupId,
    productIds: [productId],
  };
  const products = await client
    .mutate({
      mutation: SELLING_PLAN_REMOVE_PRODUCT(),
      variables: variables,
    })
    .then(
      (response: {
        data: {
          sellingPlanGroupRemoveProducts: {
            removedProductIds: string[];
          };
        };
      }) => {
        return response.data.sellingPlanGroupRemoveProducts.removedProductIds;
      },
    );

  return products;
};
