import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_GROUP_DELETE() {
  return gql`
    mutation sellingPlanGroupDelete($id: ID!) {
      sellingPlanGroupDelete(id: $id) {
        deletedSellingPlanGroupId
        userErrors {
          code
          field
          message
        }
      }
    }
  `;
}

export const deleteSellingPlanGroup = async (req: Request) => {
  const { client } = req;
  const body = req.body as {
    sellingPlanGroupId: string;
  };
  const { sellingPlanGroupId } = body;
  const variables = {
    id: sellingPlanGroupId,
  };
  const deletedSellingPlanGroupId = await client
    .mutate({
      mutation: SELLING_PLAN_GROUP_DELETE(),
      variables: variables,
    })
    .then(
      (response: {
        data: {
          sellingPlanGroupDelete: {
            deletedSellingPlanGroupId: string;
          };
        };
      }) => {
        return response.data.sellingPlanGroupDelete.deletedSellingPlanGroupId;
      },
    );

  return deletedSellingPlanGroupId;
};
