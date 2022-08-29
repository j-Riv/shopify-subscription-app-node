import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;

export function SUBSCRIPTION_CONTRACT_GET() {
  return gql`
    query subscriptionContract($id: ID!) {
      subscriptionContract(id: $id) {
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
        # lineCount
        lines(first: 20) {
          edges {
            node {
              id
              productId
              variantId
              title
              variantTitle
              quantity
              requiresShipping
              variantImage {
                originalSrc
                altText
              }
              pricingPolicy {
                cycleDiscounts {
                  adjustmentType
                  computedPrice {
                    amount
                  }
                }
                basePrice {
                  amount
                  currencyCode
                }
              }
              customAttributes {
                key
                value
              }
            }
          }
        }
        originOrder {
          legacyResourceId
        }
        lastPaymentStatus
        customerPaymentMethod {
          id
        }
        deliveryPolicy {
          interval
          intervalCount
        }
        billingPolicy {
          interval
          intervalCount
        }
        deliveryMethod {
          ... on SubscriptionDeliveryMethodShipping {
            address {
              address1
              address2
              city
              country
              province
              zip
              name
              company
              firstName
              lastName
            }
          }
        }
      }
    }
  `;
}

interface Data {
  data: {
    subscriptionContract: SubscriptionContractData;
  };
}

export interface SubscriptionContractData {
  id: string;
  status: string;
  nextBillingDate: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deliveryPrice: {
    currencyCode: string;
    amount: string;
  };
  lines: {
    edges: SubscriptionLineData[];
  };
  originOrder: {
    legacyResourceId: string;
  };
  lastPaymentStatus: string;
  customerPaymentMethod: {
    id: string;
  };
  deliveryPolicy: {
    interval: string;
    intervalCount: number;
  };
  billingPolicy: {
    interval: string;
    intervalCount: number;
  };
  deliveryMethod: {
    address: {
      address1: string;
      address2: string;
      city: string;
      country: string;
      province: string;
      zip: string;
      name: string;
      company: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface SubscriptionLineData {
  node: {
    id: string;
    productId: string;
    variantId: string;
    title: string;
    variantTitle: string;
    quantity: number;
    requiresShipping: boolean;
    variantImage: {
      originalSrc: string;
      altText: string;
    };
    pricingPolicy: {
      cycleDiscounts: {
        adjustmentType: string;
        computedPrice: {
          amount: string;
        };
      };
      basePrice: {
        amount: string;
        currency: string;
      };
    };
  };
}

export const getSubscriptionContract = async (
  client: any,
  id: string,
): Promise<SubscriptionContractData> => {
  const subscriptionContract = await client
    .query({
      query: SUBSCRIPTION_CONTRACT_GET(),
      variables: {
        id: id,
      },
    })
    .then((response: Data) => {
      return response.data.subscriptionContract;
    });

  return subscriptionContract;
};
