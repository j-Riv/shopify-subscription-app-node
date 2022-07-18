import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
// export function PRODUCT_VARIANT_BY_ID_GET() {
//   return gql`
//     query productVariant($id: ID!, $locationId: ID!) {
//       productVariant(id: $id) {
//         id
//         title
//         sku
//         inventoryQuantity
//         inventoryItem {
//           inventoryLevel(locationId: $locationId) {
//             available
//           }
//           inventoryLevels(first: 1) {
//             edges {
//               node {
//                 available
//                 location {
//                   id
//                   name
//                 }
//               }
//             }
//           }
//         }
//         product {
//           title
//         }
//       }
//     }
//   `;
// }

export function PRODUCT_VARIANT_BY_ID_GET() {
  return gql`
    query productVariant($id: ID!, $locationId: ID!) {
      productVariant(id: $id) {
        id
        title
        sku
        inventoryItem {
          inventoryLevel(locationId: $locationId) {
            available
            location {
              name
            }
          }
        }
        product {
          title
        }
      }
    }
  `;
}

interface Data {
  data: {
    productVariant: ProductVariantData;
  };
}

interface ProductVariantData {
  id: string;
  title: string;
  sku: string;
  inventoryQuantity: number;
  inventoryItem: {
    inventoryLevel: {
      available: number;
    };
    inventoryLevels: {
      edges: {
        node: {
          available: number;
        }[];
      };
    };
  };
  product: {
    title: string;
  };
}

export const getProductVariantById = async (
  client: any,
  id: string,
  locationId: string,
): Promise<ProductVariantData> => {
  const productVariant = await client
    .query({
      query: PRODUCT_VARIANT_BY_ID_GET(),
      variables: {
        id: id,
        locationId: locationId,
      },
    })
    .then((response: Data) => {
      return response.data.productVariant;
    });
  return productVariant;
};
