import 'isomorphic-fetch';
import pkg from '@apollo/client';
const { gql } = pkg;
export function DEFAULT_LOCATION_GET() {
  return gql`
    query defaultLocation {
      location {
        id
        name
      }
    }
  `;
}

interface Data {
  data: {
    location: LocationData;
  };
}

interface LocationData {
  id: string;
  name: string;
}

export const getDefaultLocation = async (client: any): Promise<LocationData> => {
  const defaultLocation = await client
    .query({
      query: DEFAULT_LOCATION_GET(),
    })
    .then((response: Data) => {
      return response.data.location;
    });
  return defaultLocation;
};
