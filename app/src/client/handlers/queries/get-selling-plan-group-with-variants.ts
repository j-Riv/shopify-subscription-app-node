import { gql } from '@apollo/client';

export const GET_SELLING_PLAN_GROUP_WITH_VARIANTS = gql`
  query sellingPlanGroup($id: ID!) {
    sellingPlanGroup(id: $id) {
      id
      productVariants(first: 250) {
        edges {
          node {
            id
            price
            title
            sku
            sellableOnlineQuantity
            product {
              title
            }
          }
        }
      }
    }
  }
`;
