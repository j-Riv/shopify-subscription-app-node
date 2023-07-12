import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}
export function CUSTOMER_SUBSCRIPTIONS_CONTRACTS_BY_ID_GET() {
  return gql`
    query customers($first: Int!, $query: String!) {
      customers(first: 1, query: $query) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
        edges {
          node {
            id
            verifiedEmail
            firstName
            lastName
            subscriptionContracts(first: $first) {
              edges {
                cursor
                node {
                  id
                  createdAt
                  status
                  nextBillingDate
                  deliveryPrice {
                    amount
                  }
                  customerPaymentMethod {
                    id
                    instrument {
                      ... on CustomerCreditCard {
                        lastDigits
                        expiryMonth
                        expiryYear
                        maskedNumber
                        brand
                        name
                        billingAddress {
                          address1
                          city
                          country
                          countryCode
                          province
                          provinceCode
                          zip
                        }
                      }
                    }
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
                        countryCode
                        province
                        provinceCode
                        zip
                        name
                        company
                        firstName
                        lastName
                        phone
                      }
                    }
                  }
                  lines(first: 10) {
                    edges {
                      node {
                        id
                        sku
                        productId
                        variantId
                        quantity
                        title
                        variantTitle
                        variantImage {
                          altText
                          originalSrc
                        }
                        currentPrice {
                          amount
                        }
                        pricingPolicy {
                          basePrice {
                            amount
                          }
                        }
                        customAttributes {
                          key
                          value
                        }
                      }
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

interface Data {
  data: {
    customers: {
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      edges: CustomerData[];
    };
  };
}

interface CustomerData {
  node: {
    id: string;
    verifiedEmail: boolean;
    firstName: string;
    lastName: string;
    subscriptionContracts: {
      edges: SubscriptionContractData[];
    };
  };
}

interface SubscriptionContractData {
  cursor: string;
  node: {
    id: string;
    createdAt: string;
    status: string;
    nextBillingDate: string;
    deliveryPrice: {
      amount: string;
    };
    customerPaymentMethod: {
      id: string;
      instrument: any;
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
        countryCode: string;
        province: string;
        provinceCode: string;
        zip: string;
        name: string;
        company: string;
        firstName: string;
        lastName: string;
        phone: string;
      };
    };
    lines: {
      edges: LineData[];
    };
  };
}

interface LineData {
  node: {
    id: string;
    sku: string;
    productId: string;
    variantId: string;
    quantity: number;
    title: string;
    variantTitle: string;
    variantImage: {
      altText: string;
      originalSrc: string;
    };
    currentPrice: {
      amount: string;
    };
    pricingPolicy: {
      basePrice: {
        amount: string;
      };
    };
    customAttributes: {
      key: string;
      value: string;
    }[];
  };
}

export const getCustomerSubscriptionContractsById = async (
  req: Request,
  customerId: string,
): Promise<[] | SubscriptionContractData[]> => {
  const { client } = req;
  const subscriptionContracts = await client
    .query({
      query: CUSTOMER_SUBSCRIPTIONS_CONTRACTS_BY_ID_GET(),
      variables: {
        first: 20,
        query: `id:${customerId}`,
      },
    })
    .then((response: Data) => {
      console.log('getCustomerSubscriptionContractsById', response);
      return response.data.customers.edges.length > 0
        ? response.data.customers.edges[0].node.subscriptionContracts.edges
        : response.data.customers.edges;
    });
  return subscriptionContracts;
};
