import React, { useState, useCallback, useEffect } from 'react';
import { Badge, Button, Card, Frame, Page, Select, Toast } from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge/utilities';
import { Redirect } from '@shopify/app-bridge/actions';
import { formatDate, formatId } from '../utils/formatters';
import Table from '../components/Table';
import LoadingContracts from '../components/LoadingContracts';
import ErrorState from '../components/ErrorState';
import SearchBar from '../components/SearchBar';
import { getBadge } from '../utils/status';
import { LocalContract } from '../types/subscriptions';

enum Status {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

interface StatusSelectProps {
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

const StatusSelect: React.FC<StatusSelectProps> = ({ selectedStatus, setSelectedStatus }) => {
  const handleSelectChange = useCallback((value: string) => setSelectedStatus(value), []);

  const options = [
    { label: 'ACTIVE', value: Status.ACTIVE },
    { label: 'PAUSED', value: Status.PAUSED },
    { label: 'CANCELLED', value: Status.CANCELLED },
  ];

  return (
    <Select label="Status" options={options} onChange={handleSelectChange} value={selectedStatus} />
  );
};

const Contracts: React.FC = () => {
  // state
  const [selectedStatus, setSelectedStatus] = useState<string>(Status.ACTIVE);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);

  const [active, setActive] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  // Toast
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const setMsg = useCallback((msg) => setToastMsg(msg), []);
  const setToastError = useCallback((error) => setIsError(error), []);
  const toastMarkup = active ? (
    <Toast content={toastMsg} onDismiss={toggleActive} error={isError} />
  ) : null;
  // set subscriptions per page
  // const subsPerPage = 20;
  // search state
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const getSubscriptions = useCallback(
    async (status: string = 'ACTIVE') => {
      setLoading(true);
      setToastError(false);
      const fetchFunction = authenticatedFetch(app);
      try {
        const response = await fetchFunction('/api/contracts-by-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: status }),
        });

        const jsonResponse = await response.json();
        console.log('JSON RESPONSE', jsonResponse);
        if (jsonResponse) {
          console.log('JSON.RESPONSE', jsonResponse);
          setData(jsonResponse);
          setLoading(false);
        }
      } catch (err) {
        console.log('ERROR', err.message);
        setMsg(err.message);
        setToastError(true);
        toggleActive();
        setError(true);
      }
    },
    [status],
  );

  useEffect(() => {
    getSubscriptions(selectedStatus);
  }, [getSubscriptions, selectedStatus]);

  if (loading) return <LoadingContracts title="Subscriptions" />;
  if (error) return <ErrorState err={'Something went wrong ...'} />;

  const appRedirect = (href: string) => {
    redirect.dispatch(Redirect.Action.APP, href);
  };

  return (
    <Page
      title="Contracts"
      // titleMetadata={<Badge status="success">Active</Badge>}
      subtitle="Subscription Contracts"
    >
      <Frame>
        <TitleBar title="Subscriptions" />
        {toastMarkup}
        <Card sectioned>
          <SearchBar />
        </Card>
        <Card title="Subscriptions" sectioned>
          <StatusSelect selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} />
          {data && data.length > 0 ? (
            <>
              <Table
                contentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={[
                  'Status',
                  'ID',
                  'Email',
                  // 'Customer ID',
                  'Next Order Date',
                  'Last Payment Status',
                  'Actions',
                ]}
                rows={data.map((el: LocalContract) => {
                  return [
                    <Badge key={el.contract.id} status={getBadge(el.contract.status)}>
                      {el.contract.status}
                    </Badge>,
                    formatId(el.contract.id),
                    el.contract.customer.email,
                    formatDate(el.contract.nextBillingDate),
                    el.contract.lastPaymentStatus,
                    <Button
                      key={el.contract.id}
                      plain
                      onClick={() =>
                        appRedirect(
                          `/subscriptions?customer_id=${formatId(
                            el.contract.customer.id,
                          )}&id=${formatId(el.contract.id)}`,
                        )
                      }
                    >
                      View
                    </Button>,
                  ];
                })}
              />
              {/* <Pagination
                hasPrevious={pageInfo.hasPreviousPage}
                onPrevious={() => {
                  fetchMore({
                    query: GET_PREV_SUBSCRIPTION_CONTRACTS,
                    variables: {
                      last: subsPerPage,
                      before: firstCursor,
                    },
                  });
                }}
                hasNext={pageInfo.hasNextPage}
                onNext={() => {
                  fetchMore({
                    variables: {
                      first: subsPerPage,
                      after: lastCursor,
                    },
                  });
                }}
              /> */}
            </>
          ) : (
            <p style={{ textAlign: 'center' }}>No Subscriptions Found</p>
          )}
        </Card>
      </Frame>
    </Page>
  );
};

export default Contracts;
