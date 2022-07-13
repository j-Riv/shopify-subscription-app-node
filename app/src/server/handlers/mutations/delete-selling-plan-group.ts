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

interface Data {
  data: {
    sellingPlanGroupDelete: SellingPlanGroupData;
  };
}

interface SellingPlanGroupData {
  deletedSellingPlanGroupId: string;
}

export const deleteSellingPlanGroup = async (req: Request): Promise<SellingPlanGroupData> => {
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
    .then((response: Data) => {
      return response.data.sellingPlanGroupDelete.deletedSellingPlanGroupId;
    });

  return deletedSellingPlanGroupId;
};
