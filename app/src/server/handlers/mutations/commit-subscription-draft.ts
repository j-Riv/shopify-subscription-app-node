import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;

export function SUBSCRIPTION_DRAFT_COMMIT() {
  return gql`
    mutation subscriptionDraftCommit($draftId: ID!) {
      subscriptionDraftCommit(draftId: $draftId) {
        contract {
          id
          status
          customer {
            email
            firstName
            lastName
          }
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
    subscriptionDraftCommit: {
      contract: SubscriptionContractData;
      userErrors: any[];
    };
  };
}

interface SubscriptionContractData {
  id: string;
  status: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const commitSubscriptionDraft = async (
  client: any,
  id: string,
): Promise<SubscriptionContractData> => {
  const subscriptionDraftCommit = await client
    .mutate({
      mutation: SUBSCRIPTION_DRAFT_COMMIT(),
      variables: {
        draftId: id,
      },
    })
    .then((response: Data) => {
      const data = response.data.subscriptionDraftCommit;
      if (data.userErrors.length > 0) {
        return data.userErrors;
      }
      return data.contract;
    });

  return subscriptionDraftCommit;
};
