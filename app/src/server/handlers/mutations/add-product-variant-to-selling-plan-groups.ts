import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_ADD_PRODUCT_VARIANT() {
  return gql`
    mutation productVariantJoinSellingPlanGroups($id: ID!, $sellingPlanGroupIds: [ID!]!) {
      productVariantJoinSellingPlanGroups(id: $id, sellingPlanGroupIds: $sellingPlanGroupIds) {
        productVariant {
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
    productVariantJoinSellingPlanGroups: {
      productVariant: {
        id: string;
      };
      userErrors: any[];
    };
  };
}

export const addProductVariantToSellingPlanGroups = async (req: Request): Promise<Data> => {
  const { client } = req;
  const body = req.body as {
    variantId: string;
    selectedPlans: string[];
  };
  const { variantId, selectedPlans } = body;
  const variables = {
    id: variantId,
    sellingPlanGroupIds: selectedPlans,
  };
  const productVariant = await client
    .mutate({
      mutation: SELLING_PLAN_ADD_PRODUCT_VARIANT(),
      variables: variables,
    })
    .then((response: Data) => {
      return response.data;
    });

  return productVariant;
};
