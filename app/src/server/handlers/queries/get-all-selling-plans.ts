import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_GET() {
  return gql`
    query {
      sellingPlanGroups(first: 20) {
        edges {
          node {
            id
            appId
            description
            options
            name
            sellingPlans(first: 20) {
              edges {
                node {
                  id
                  name
                  options
                }
              }
            }
          }
        }
      }
    }
  `;
}

interface Data {
  data: {
    sellingPlanGroups: {
      edges: SellingPlanGroupData[];
    };
  };
}

interface SellingPlanGroupData {
  node: {
    id: string;
    appId: string;
    description: string;
    options: string;
    name: string;
    sellingPlans: {
      edges: [
        {
          node: {
            id: string;
            name: string;
            options: string;
          };
        },
      ];
    };
  };
}

export const getSellingPlans = async (req: Request): Promise<SellingPlanGroupData> => {
  const { client } = req;
  const sellingPlanGroups = await client
    .query({
      query: SELLING_PLAN_GET(),
    })
    .then((response: Data) => {
      return response.data.sellingPlanGroups.edges;
    });

  return sellingPlanGroups;
};
