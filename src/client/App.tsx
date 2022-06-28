import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import { Provider as AppBridgeProvider, useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';
import { Redirect } from '@shopify/app-bridge/actions';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import translations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import { ClientApplication, AppBridgeState } from '@shopify/app-bridge';
// import HomePage from './components/HomePage';
import TestPage from './components/TestPage';
import Dashboard from './routes/dashboard';
import SellingPlanGroups from './routes/selling-plan-groups';
import SellingPlanGroup from './routes/selling-plan-group';
import Search from './routes/search';

export function userLoggedInFetch(app: ClientApplication<AppBridgeState>) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri: RequestInfo, options?: RequestInit) => {
    const response = await fetchFunction(uri, options);

    if (response.headers.get('X-Shopify-API-Request-Failure-Reauthorize') === '1') {
      const authUrlHeader = response.headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url');

      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, authUrlHeader || '/auth');
      return null;
    }

    return response;
  };
}

interface Props {
  children: ReactNode;
}

const MyProvider: React.FC<Props> = ({ children }) => {
  const app = useAppBridge();

  const client = new ApolloClient({
    cache: new InMemoryCache(),
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
          apiKey: process.env.SHOPIFY_API_KEY,
          host: new URL(window.location.href).searchParams.get('host'),
          forceRedirect: true,
        }}
      >
        <MyProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/selling-plan-groups" element={<SellingPlanGroups />} />
            <Route path="/selling-plan-group" element={<SellingPlanGroup />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MyProvider>
      </AppBridgeProvider>
    </PolarisProvider>
  </BrowserRouter>
);

export default App;
