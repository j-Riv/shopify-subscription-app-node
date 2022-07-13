import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function SUBSCRIPTION_CONTRACTS_GET() {
  return gql`
    query subscriptionContracts($first: Int!, $after: String) {
      subscriptionContracts(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
        edges {
          cursor
          node {
            id
            status
            nextBillingDate
            customer {
              id
              firstName
              lastName
              email
            }
            customerPaymentMethod {
              id
            }
            deliveryPrice {
              currencyCode
              amount
            }
            originOrder {
              legacyResourceId
            }
            lastPaymentStatus
            deliveryPolicy {
              interval
              intervalCount
            }
            billingPolicy {
              interval
              intervalCount
            }
          }
        }
      }
    }
  `;
}

interface Data {
  data: {
    subscriptionContracts: SubscriptionContractsData;
  };
}

interface SubscriptionContractsData {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  edges: SubscriptionContractData[];
}

interface SubscriptionContractData {
  cursor: string;
  node: {
    id: string;
    status: string;
    nextBillingDate: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    customerPaymentMethod: {
      id: string;
    };
    deliveryPrice: {
      currencyCode: string;
      amount: string;
    };
    originOrder: {
      legacyResourceId: string;
    };
    lastPaymentStatus: string;
    deliveryPolicy: {
      interval: string;
      intervalCount: number;
    };
    billingPolicy: {
      interval: string;
      intervalCount: number;
    };
  };
}

export const getSubscriptionContracts = async (
  client: any,
  variables: any,
): Promise<SubscriptionContractsData> => {
  const subscriptionContracts = await client
    .query({
      query: SUBSCRIPTION_CONTRACTS_GET(),
      variables: variables,
    })
    .then((response: Data) => {
      return response.data.subscriptionContracts;
    });

  return subscriptionContracts;
};
