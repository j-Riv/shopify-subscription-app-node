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

interface Data {
  data: {
    customerPaymentMethodSendUpdateEmail: {
      customer: {
        id: string;
      };
      userErrors: any[];
    };
  };
}

export const updatePaymentMethod = async (client: any, id: string): Promise<string> => {
  console.log('UPDATING PAYMENT METHOD', id);
  const subscriptionContractUpdate = await client
    .mutate({
      mutation: PAYMENT_METHOD_UPDATE(),
      variables: {
        customerPaymentMethodId: id,
      },
    })
    .then((response: Data) => {
      return response.data.customerPaymentMethodSendUpdateEmail.customer.id;
    });

  return subscriptionContractUpdate;
};
