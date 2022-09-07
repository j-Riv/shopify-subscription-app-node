import { gql } from '@apollo/client';

export const ADD_SUBSCRIPTION_DRAFT_LINE = gql`
  mutation subscriptionDraftLineAdd($draftId: ID!, $input: SubscriptionLineInput!) {
    subscriptionDraftLineAdd(draftId: $draftId, input: $input) {
      draft {
        # SubscriptionDraft fields
        id
      }
      lineAdded {
        # SubscriptionLine fields
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;
