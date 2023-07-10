import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import { Provider as AppBridgeProvider, useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge/utilities';
import { Redirect } from '@shopify/app-bridge/actions';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import translations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import { ClientApplication, AppBridgeState } from '@shopify/app-bridge';
// import HomePage from './components/HomePage';
import Dashboard from './routes/dashboard';
import Contracts from './routes/contracts';
import PaymentFailures from './routes/payment-failures';
import SellingPlanGroups from './routes/selling-plan-groups';
import SellingPlanGroup from './routes/selling-plan-group';
import Search from './routes/search';
import Subscriptions from './routes/subscriptions';
import './app.css';

function checkHeadersForReauthorization(headers, app) {
  console.log(
    'X-Shopify-API-Request-Failure-Reauthorize',
    headers.get('X-Shopify-API-Request-Failure-Reauthorize'),
  );
  if (headers.get('X-Shopify-API-Request-Failure-Reauthorize') === '1') {
    const authUrlHeader =
      headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url') || '/api/auth';

    const redirect = Redirect.create(app);
    redirect.dispatch(
      Redirect.Action.REMOTE,
      authUrlHeader.startsWith('/')
        ? `https://${window.location.host}${authUrlHeader}`
        : authUrlHeader,
    );
  }
}

export function userLoggedInFetch(app: ClientApplication<AppBridgeState>) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri: RequestInfo, options?: RequestInit) => {
    console.log('URI', uri);
    // console.log('process.env.SHOPIFY_API_KEY', `${process.env.SHOPIFY_API_KEY}`);
    const response = await fetchFunction('/api' + uri, options);
    console.log('FETCH RESPONSE', response);
    checkHeadersForReauthorization(response.headers, app);
    return response;
  };
}

// export function userLoggedInFetch(app: ClientApplication<AppBridgeState>) {
//   const fetchFunction = authenticatedFetch(app);

//   return async (uri: RequestInfo, options?: RequestInit) => {
//     const response = await fetchFunction(uri, options);

//     if (response.headers.get('X-Shopify-API-Request-Failure-Reauthorize') === '1') {
//       const authUrlHeader =
//         response.headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url') || '/api/auth';
//       console.log('Redirect.Action.REMOTE', Redirect.Action.APP);
//       console.log('authUrlHeader', authUrlHeader);
//       const redirect = Redirect.create(app);
//       // redirect.dispatch(Redirect.Action.APP, authUrlHeader || '/api/auth');
//       redirect.dispatch(
//         Redirect.Action.REMOTE,
//         authUrlHeader.startsWith('/')
//           ? `https://${window.location.host}${authUrlHeader}`
//           : authUrlHeader,
//       );
//       // return null;
//     }

//     return response;
//   };
// }

interface Props {
  children: ReactNode;
}

const MyProvider: React.FC<Props> = ({ children }) => {
  const app = useAppBridge();

  const client = new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            subscriptionContracts: {
              keyArgs: false,
            },
          },
        },
      },
    }),
    link: new HttpLink({
      credentials: 'include',
      fetch: userLoggedInFetch(app),
    }),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

const App = () => (
  <BrowserRouter>
    <PolarisProvider i18n={translations}>
      <AppBridgeProvider
        config={{
          // apiKey: process.env.SHOPIFY_API_KEY,
          apiKey: '8afa485189a69fe949cc451d16b3d5d6',
          host: new URL(window.location.href).searchParams.get('host'),
          forceRedirect: true,
        }}
      >
        <MyProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/payment-failures" element={<PaymentFailures />} />
            <Route path="/selling-plan-groups" element={<SellingPlanGroups />} />
            <Route path="/selling-plan-group" element={<SellingPlanGroup />} />
            <Route path="/search" element={<Search />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
          </Routes>
        </MyProvider>
      </AppBridgeProvider>
    </PolarisProvider>
  </BrowserRouter>
);

export default App;
