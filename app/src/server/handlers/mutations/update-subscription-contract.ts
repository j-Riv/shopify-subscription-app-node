import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function SUBSCRIPTION_CONTRACT_UPDATE() {
  return gql`
    mutation subscriptionContractUpdate($contractId: ID!) {
      subscriptionContractUpdate(contractId: $contractId) {
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
    subscriptionContractUpdate: {
      draft: {
        id: string;
      };
    };
  };
}

export const updateSubscriptionContract = async (client: any, id: string): Promise<string> => {
  console.log('UPDATING SUBSCRIPTION CONTRACT ID', id);
  const subscriptionContractUpdate = await client
    .mutate({
      mutation: SUBSCRIPTION_CONTRACT_UPDATE(),
      variables: {
        contractId: id,
      },
    })
    .then((response: Data) => {
      return response.data.subscriptionContractUpdate.draft.id;
    });

  return subscriptionContractUpdate;
};
