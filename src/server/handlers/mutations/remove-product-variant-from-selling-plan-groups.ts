import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_REMOVE_PRODUCT_VARIANT() {
  return gql`
    mutation productVariantLeaveSellingPlanGroups($id: ID!, $sellingPlanGroupIds: [ID!]!) {
      productVariantLeaveSellingPlanGroups(id: $id, sellingPlanGroupIds: $sellingPlanGroupIds) {
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

export const removeProductVariantFromSellingPlanGroups = async (req: Request) => {
  const { client } = req;
  const body = req.body as {
    variantId: string;
    sellingPlanGroupId: string;
  };
  const { variantId, sellingPlanGroupId } = body;
  const variables = {
    id: variantId,
    sellingPlanGroupIds: [sellingPlanGroupId],
  };
  console.log('VARIABLES', variables);
  const productVariant = await client
    .mutate({
      mutation: SELLING_PLAN_REMOVE_PRODUCT_VARIANT(),
      variables: variables,
    })
    .then((response: { data: any }) => {
      // response.data.productVariantLeaveSellingPlanGroups.productVariant.id;
      console.log('response', response.data);
      return response.data;
    });

  return productVariant;
};
