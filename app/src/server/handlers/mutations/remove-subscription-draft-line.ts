import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function SUBSCRIPTION_DRAFT_LINE_REMOVE() {
  return gql`
    mutation subscriptionDraftLineRemove($draftId: ID!, $lineId: ID!) {
      subscriptionDraftLineRemove(draftId: $draftId, lineId: $lineId) {
        draft {
          id
        }
        lineRemoved {
          id
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;
}

interface Data {
  data: {
    subscriptionDraftLineRemove: {
      draft: {
        id: string;
      };
      userErrors: any[];
    };
  };
}

export const removeSubscriptionDraftLine = async (
  client: any,
  draftId: string,
  lineId: string,
): Promise<string> => {
  const subscriptionDraftLineRemove = await client
    .mutate({
      mutation: SUBSCRIPTION_DRAFT_LINE_REMOVE(),
      variables: {
        draftId: draftId,
        lineId: lineId,
      },
    })
    .then((response: Data) => {
      const data = response.data.subscriptionDraftLineRemove;
      if (data.userErrors.length > 0) {
        return data.userErrors;
      }
      return data.draft.id;
    });

  return subscriptionDraftLineRemove;
};
