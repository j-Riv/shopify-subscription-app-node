import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function SELLING_PLAN_GET() {
  return gql`
    query sellingPlanGroup($id: ID!) {
      sellingPlanGroup(id: $id) {
        id
        appId
        description
        options
        name
        merchantCode
        summary
        sellingPlans(first: 10) {
          edges {
            node {
              id
              name
              description
              options
              position
              billingPolicy {
                ... on SellingPlanRecurringBillingPolicy {
                  interval
                  intervalCount
                }
              }
              deliveryPolicy {
                ... on SellingPlanRecurringDeliveryPolicy {
                  interval
                  intervalCount
                }
              }
              pricingPolicies {
                ... on SellingPlanFixedPricingPolicy {
                  adjustmentType
                  adjustmentValue {
                    ... on SellingPlanPricingPolicyPercentageValue {
                      percentage
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
}

interface SellingPlanGroupData {
  id: string;
  appId: string;
  description: string;
  options: string[];
  name: string;
  merchantCode: string;
  summary: string;
  sellingPlans: {
    edges: SellingPlanData[];
  };
}

interface SellingPlanData {
  node: {
    id: string;
    name: string;
    description: string;
    options: string[];
    position: number;
    billingPolicy: {
      interval: string;
      intervalCount: number;
    };
    deliveryPolicty: {
      interval: string;
      intervalCount: number;
    };
    pricingPolicies: [
      {
        adjustmentType: string;
        adjustmentValue: {
          percentage: number;
        };
      },
    ];
  };
}

interface FilteredPlan {
  id: string;
  name: string;
  options: string[];
  position: string | number;
}

interface Data {
  data: {
    sellingPlanGroup: SellingPlanData;
  };
}

const buildResponse = (data: SellingPlanGroupData) => {
  const sellingPlans = data.sellingPlans.edges;
  const plans: FilteredPlan[] = [];
  sellingPlans.forEach((plan) => {
    let planData: FilteredPlan = {
      id: plan.node.id,
      name: plan.node.name,
      options: plan.node.options,
      position: plan.node.position,
    };
    plans.push(planData);
  });
  const response = {
    description: data.description,
    id: data.id,
    name: data.name,
    merchantCode: data.merchantCode,
    options: data.options,
    percentageOff: data.sellingPlans.edges[0].node.pricingPolicies[0].adjustmentValue.percentage,
    interval: data.sellingPlans.edges[0].node.billingPolicy.interval,
    sellingPlans: plans,
  };
  return response;
};

export const getSellingPlanById = async (req: Request): Promise<SellingPlanGroupData> => {
  const { client } = req;
  const body = req.body as {
    sellingPlanGroupId: string;
  };
  const { sellingPlanGroupId } = body;
  const sellingPlanGroup = await client
    .query({
      query: SELLING_PLAN_GET(),
      variables: {
        id: sellingPlanGroupId,
      },
    })
    .then((response: Data) => {
      return response.data.sellingPlanGroup;
    });

  return sellingPlanGroup;
};
