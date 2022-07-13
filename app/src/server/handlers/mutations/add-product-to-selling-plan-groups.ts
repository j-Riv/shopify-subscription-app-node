import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_ADD_PRODUCT() {
  return gql`
    mutation productJoinSellingPlanGroups($id: ID!, $sellingPlanGroupIds: [ID!]!) {
      productJoinSellingPlanGroups(id: $id, sellingPlanGroupIds: $sellingPlanGroupIds) {
        product {
          id
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;
}

interface Data {
  data: {
    productJoinSellingPlanGroups: {
      product: {
        id: string;
      };
      userErrors: any[];
    };
  };
}

export const addProductToSellingPlanGroups = async (req: Request): Promise<Data> => {
  const { client } = req;
  const body = req.body as {
    productId: string;
    selectedPlans: string[];
  };
  const { productId, selectedPlans } = body;
  const variables = {
    id: productId,
    sellingPlanGroupIds: selectedPlans,
  };
  const product = await client
    .mutate({
      mutation: SELLING_PLAN_ADD_PRODUCT(),
      variables: variables,
    })
    .then((response: Data) => {
      return response.data;
    });

  return product;
};
