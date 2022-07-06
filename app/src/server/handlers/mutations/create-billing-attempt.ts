import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { v4 as uuidv4 } from 'uuid';

export function CREATE_SUBSCRIPTION_BILLING_ATTEMPT() {
  return gql`
    mutation subscriptionBillingAttemptCreate(
      $subscriptionContractId: ID!
      $subscriptionBillingAttemptInput: SubscriptionBillingAttemptInput!
    ) {
      subscriptionBillingAttemptCreate(
        subscriptionContractId: $subscriptionContractId
        subscriptionBillingAttemptInput: $subscriptionBillingAttemptInput
      ) {
        subscriptionBillingAttempt {
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

export const createSubscriptionBillingAttempt = async (
  client: any,
  subscriptionContractId: string,
) => {
  const variables = {
    subscriptionContractId: subscriptionContractId,
    subscriptionBillingAttemptInput: {
      idempotencyKey: uuidv4(), // needs to be generated
    },
  };
  const subscriptionBillingAttemptId = await client
    .mutate({
      mutation: CREATE_SUBSCRIPTION_BILLING_ATTEMPT(),
      variables: variables,
    })
    .then((response: { data?: any }) => {
      return response.data.subscriptionBillingAttemptCreate.subscriptionBillingAttempt;
    });

  return subscriptionBillingAttemptId;
};
