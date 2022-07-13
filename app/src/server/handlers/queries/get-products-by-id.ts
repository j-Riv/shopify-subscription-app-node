import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
import { Request as Req } from 'express';

interface Request extends Req {
  client: any;
}

export function PRODUCTS_BY_ID_GET() {
  return gql`
    query products($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          variants(first: 5) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      }
    }
  `;
}

interface Data {
  data: {
    nodes: NodeData[];
  };
}

interface NodeData {
  id: string;
  title: string;
  variants: {
    edges: VariantData[];
  };
}

interface VariantData {
  node: {
    id: string;
    title: string;
  };
}

export const getProductsById = async (req: Request, ids: string[]): Promise<NodeData[]> => {
  const { client } = req;
  const products = await client
    .query({
      query: PRODUCTS_BY_ID_GET(),
      variables: {
        ids: ids,
      },
    })
    .then((response: Data) => {
      return response.data.nodes;
    });
  return products;
};
