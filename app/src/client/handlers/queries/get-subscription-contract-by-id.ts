import { gql } from '@apollo/client';

export const GET_SUBSCRIPTION_BY_ID = gql`
  query subscriptionContract($id: ID!) {
    subscriptionContract(id: $id) {
      id
      status
      createdAt
      nextBillingDate
      lastPaymentStatus
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
      lineCount
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
              basePrice {
                amount
              }
            }
            currentPrice {
              amount
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
            sellingPlanId
            sellingPlanName
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
            phone
          }
        }
      }
    }
    sellingPlanGroups(first: 25) {
      edges {
        node {
          id
          sellingPlans(first: 25) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`;
