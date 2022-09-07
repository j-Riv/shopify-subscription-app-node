import { gql } from '@apollo/client';

export const GET_ALL_SELLING_PLAN_GROUPS = gql`
  query {
    sellingPlanGroups(first: 25) {
      edges {
        node {
          id
          appId
          description
          options
          name
          summary
          sellingPlans(first: 25) {
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
