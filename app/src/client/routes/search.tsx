import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Badge, Button, Card, Page } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { GET_CUSTOMER_SUBSCRIPTION_CONTRACTS_BY_EMAIL } from '../handlers';
import { formatDate, formatId } from '../utils/formatters';
import Table from '../components/Table';
import LoadingIndex from '../components/LoadingIndex';
import ErrorState from '../components/ErrorState';
import SearchBar from '../components/SearchBar';
import { Contract } from '../types/subscriptions';
import { getBadge } from '../utils/status';

function Index() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const userEmail = searchParams.get('email');
    setEmail(userEmail);
  }, []);

  console.log('USE PARAMS', useSearchParams);
  // search state
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const { loading, error, data } = useQuery(GET_CUSTOMER_SUBSCRIPTION_CONTRACTS_BY_EMAIL, {
    variables: {
      first: 50,
      query: `email:${email}`,
    },
  });

  if (loading) return <LoadingIndex tableRows={5} />;
  if (error) return <ErrorState err={error.message} />;

  if (data?.customers?.edges.length > 0) {
    const customer = data?.customers?.edges[0].node;
    const subscriptionContracts = customer.subscriptionContracts?.edges;

    const appRedirect = (href: string) => {
      redirect.dispatch(Redirect.Action.APP, href);
    };

    return (
      <Page
        title="Search"
        titleMetadata={<Badge status="success">Active</Badge>}
        subtitle={`Subscription Contracts for Customer: ${email}`}
      >
        <TitleBar title="Subscriptions" />
        <Card sectioned>
          <SearchBar />
        </Card>
        <Card title="Subscriptions" sectioned>
          {data && subscriptionContracts.length > 0 ? (
            <Table
              contentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={[
                'Status',
                'ID',
                'Email',
                'Next Order Date',
                'Last Payment Status',
                'Actions',
              ]}
              rows={subscriptionContracts.map((contract: Contract) => {
                return [
                  <Badge key={contract.node.id} status={getBadge(contract.node.status)}>
                    {contract.node.status}
                  </Badge>,
                  // formatId(contract.node.id),
                  contract.node.customer.email,
                  formatId(contract.node.customer.id),
                  formatDate(contract.node.nextBillingDate),
                  contract.node.lastPaymentStatus,
                  <Button
                    key={contract.node.id}
                    plain
                    onClick={() =>
                      appRedirect(
                        `/subscriptions?customer_id=${formatId(
                          contract.node.customer.id,
                        )}&id=${formatId(contract.node.id)}`,
                      )
                    }
                  >
                    View
                  </Button>,
                ];
              })}
            />
          ) : (
            <p style={{ textAlign: 'center' }}>No Subscriptions Found</p>
          )}
        </Card>
      </Page>
    );
  } else {
    return (
      <Page
        title="Search"
        titleMetadata={<Badge status="success">Active</Badge>}
        subtitle={`Subscription Contracts for Customer: ${email}`}
      >
        <TitleBar title="Subscriptions" />
        <Card sectioned>
          <SearchBar />
        </Card>
        <Card title="Subscriptions" sectioned>
          <p>No Subscription Contracts Found!</p>
        </Card>
      </Page>
    );
  }
}

export default Index;
