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

export const getSellingPlans = async (req: Request) => {
  const { client } = req;
  const sellingPlanGroups = await client
    .query({
      query: SELLING_PLAN_GET(),
    })
    .then(
      (response: {
        data: {
          sellingPlanGroups: {
            edges: [
              {
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
              },
            ];
          };
        };
      }) => {
        return response.data.sellingPlanGroups.edges;
      },
    );

  return sellingPlanGroups;
};
