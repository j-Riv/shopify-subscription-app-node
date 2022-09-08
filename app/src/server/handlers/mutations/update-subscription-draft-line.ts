import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function SUBSCRIPTION_DRAFT_LINE_UPDATE() {
  return gql`
    mutation subscriptionDraftLineUpdate(
      $draftId: ID!
      $input: SubscriptionLineUpdateInput!
      $lineId: ID!
    ) {
      subscriptionDraftLineUpdate(draftId: $draftId, input: $input, lineId: $lineId) {
        draft {
          id
        }
        lineUpdated {
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
    subscriptionDraftLineUpdate: {
      draft: {
        id: string;
      };
      userErrors: any[];
    };
  };
}

export const updateSubscriptionDraftLine = async (
  client: any,
  draftId: string,
  lineId: string,
  input: any,
): Promise<string> => {
  console.log('INPUT', input);

  const subscriptionDraftLineUpdate = await client
    .mutate({
      mutation: SUBSCRIPTION_DRAFT_LINE_UPDATE(),
      variables: {
        draftId: draftId,
        lineId: lineId,
        input: input,
      },
    })
    .then((response: Data) => {
      const data = response.data.subscriptionDraftLineUpdate;
      if (data.userErrors.length > 0) {
        return data.userErrors;
      }
      return data.draft.id;
    });

  return subscriptionDraftLineUpdate;
};
