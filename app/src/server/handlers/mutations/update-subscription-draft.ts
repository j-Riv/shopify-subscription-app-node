import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function SUBSCRIPTION_DRAFT_UPDATE() {
  return gql`
    mutation subscriptionDraftUpdate($draftId: ID!, $input: SubscriptionDraftInput!) {
      subscriptionDraftUpdate(draftId: $draftId, input: $input) {
        draft {
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
    subscriptionDraftUpdate: {
      draft: {
        id: string;
      };
      userErrors: any[];
    };
  };
}

export const updateSubscriptionDraft = async (
  client: any,
  draftId: string,
  input: any,
): Promise<string> => {
  console.log('INPUT', input);

  const subscriptionDraftUpdate = await client
    .mutate({
      mutation: SUBSCRIPTION_DRAFT_UPDATE(),
      variables: {
        draftId: draftId,
        input: input,
      },
    })
    .then((response: Data) => {
      const data = response.data.subscriptionDraftUpdate;
      if (data.userErrors.length > 0) {
        return data.userErrors;
      }
      return data.draft.id;
    });

  return subscriptionDraftUpdate;
};
