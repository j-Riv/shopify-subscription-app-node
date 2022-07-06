import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function PAYMENT_METHOD_UPDATE() {
  return gql`
    mutation customerPaymentMethodSendUpdateEmail($customerPaymentMethodId: ID!) {
      customerPaymentMethodSendUpdateEmail(customerPaymentMethodId: $customerPaymentMethodId) {
        customer {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
}

export const updatePaymentMethod = async (client: any, id: string) => {
  console.log('UPDATING PAYMENT METHOD', id);
  const subscriptionContractUpdate = await client
    .mutate({
      mutation: PAYMENT_METHOD_UPDATE(),
      variables: {
        customerPaymentMethodId: id,
      },
    })
    .then((response: { data?: any }) => {
      return response.data.customerPaymentMethodSendUpdateEmail.customer.id;
    });

  return subscriptionContractUpdate;
};
