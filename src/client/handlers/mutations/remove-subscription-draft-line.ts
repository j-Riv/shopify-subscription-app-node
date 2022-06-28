import { gql } from '@apollo/client';

export const REMOVE_SUBSCRIPTION_DRAFT_LINE = gql`
  mutation subscriptionDraftLineRemove($draftId: ID!, $lineId: ID!) {
    subscriptionDraftLineRemove(draftId: $draftId, lineId: $lineId) {
      draft {
        id
      }
      lineRemoved {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;
