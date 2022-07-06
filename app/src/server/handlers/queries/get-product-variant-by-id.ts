import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function PRODUCT_VARIANT_BY_ID_GET() {
  return gql`
    query productVariant($id: ID!) {
      productVariant(id: $id) {
        id
        title
        sku
        inventoryQuantity
        product {
          title
        }
      }
    }
  `;
}

export const getProductVariantById = async (client: any, id: string) => {
  const productVariant = await client
    .query({
      query: PRODUCT_VARIANT_BY_ID_GET(),
      variables: {
        id: id,
      },
    })
    .then(
      (response: {
        data: {
          productVariant: {
            id: string;
            title: string;
            sku: string;
            inventoryQuantity: number;
            product: {
              title: string;
            };
          };
        };
      }) => {
        return response.data.productVariant;
      },
    );
  return productVariant;
};
