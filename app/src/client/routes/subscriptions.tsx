import React, { useState, useCallback, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Badge,
  Card,
  Frame,
  Layout,
  Page,
  Select,
  Stack,
  TextContainer,
  TextField,
  TextStyle,
  Toast,
} from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { useQuery } from '@apollo/client';
import { Redirect } from '@shopify/app-bridge/actions';
import { GET_SUBSCRIPTION_BY_ID } from '../handlers';
import { formatId } from '../utils/formatters';
import LoadingSubscription from '../components/LoadingSubscription';
import ErrorState from '../components/ErrorState';
import CustomerInformation from '../components/CustomerInformation';
import SubscriptionInformation from '../components/SubscriptionInformation';
import UpdateSubscriptionButton from '../components/UpdateSubscriptionButton';
import RemoveLineFromSubscriptionButton from '../components/RemoveLineFromSubscriptionButton';
import UpdatePaymentMethodButton from '../components/UpdatePaymentMethodButton';
import { SubscriptionContract, Line } from '../types/subscriptions';

function EditSubscription() {
  // Get id from path
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  // Create redirects
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  // State
  const [status, setStatus] = useState<string>('');
  const [contractId, setContractId] = useState<string>('');
  const [interval, setInterval] = useState<string>('');
  const [intervalCount, setIntervalCount] = useState<string>('');
  const [nextBillingDate, setNextBillingDate] = useState<string>('');
  const [lineItems, setLineItems] = useState<Line[]>([]);
  const [lineItem, setLineItem] = useState<string>('');
  const [lineId, setLineId] = useState<string>('');
  const [lineItemQuantity, setLineItemQuantity] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>('');
  const [address1, setAddress1] = useState<string>('');
  const [address2, setAddress2] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [zip, setZip] = useState<string>('');

  const [active, setActive] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const setMsg = useCallback((msg) => setToastMsg(msg), []);
  const setToastError = useCallback((error) => setIsError(error), []);

  const toastMarkup = useMemo(
    () => (active ? <Toast content={toastMsg} onDismiss={toggleActive} error={isError} /> : null),
    [active],
  );
  // Exit if no id
  if (!id)
    return (
      <div>
        <TextStyle variation="negative">Error! No Subscription Contract ID Supplied.</TextStyle>
      </div>
    );
  // Set Data
  const setInitialData = (data: { subscriptionContract: SubscriptionContract }) => {
    if (data.subscriptionContract) {
      const d = data.subscriptionContract;
      unstable_batchedUpdates(() => {
        if (d.status) setStatus(d.status);
        if (d.id) setContractId(d.id);
        if (d.billingPolicy.interval) setInterval(d.billingPolicy.interval);
        if (d.billingPolicy.intervalCount) setIntervalCount(String(d.billingPolicy.intervalCount));
        if (d.nextBillingDate.split('T')[0]) setNextBillingDate(d.nextBillingDate.split('T')[0]);
        if (d.lines.edges[0].node.productId) setLineItem(d.lines.edges[0].node.productId);
        if (d.lines.edges[0].node.id) setLineId(d.lines.edges[0].node.id);
        if (d.lines.edges[0].node.quantity)
          setLineItemQuantity(String(d.lines.edges[0].node.quantity));
        if (d.lines.edges) setLineItems(d.lines.edges);
        if (d.customerPaymentMethod.id) setPaymentMethod(d.customerPaymentMethod.id);
        if (d.deliveryMethod.address.company) setCompany(d.deliveryMethod.address.company);
        if (d.deliveryMethod.address.address1) setAddress1(d.deliveryMethod.address.address1);
        if (d.deliveryMethod.address.address2) setAddress2(d.deliveryMethod.address.address2);
        if (d.deliveryMethod.address.city) setCity(d.deliveryMethod.address.city);
        if (d.deliveryMethod.address.country) setCountry(d.deliveryMethod.address.country);
        if (d.deliveryMethod.address.province) setProvince(d.deliveryMethod.address.province);
        if (d.deliveryMethod.address.zip) setZip(d.deliveryMethod.address.zip);
        if (d.deliveryMethod.address.firstName) setFirstName(d.deliveryMethod.address.firstName);
        if (d.deliveryMethod.address.lastName) setLastName(d.deliveryMethod.address.lastName);
      });
    }
  };
  // Get Data
  const { loading, error, data, refetch } = useQuery(GET_SUBSCRIPTION_BY_ID, {
    variables: {
      id: `gid://shopify/SubscriptionContract/${id}`,
    },
    onCompleted: (data) => setInitialData(data),
  });

  const handleIntervalChange = useCallback((value: string) => {
    setInterval(value);
  }, []);

  const handleIntervalCountChange = useCallback((value: string) => {
    setIntervalCount(value);
  }, []);

  const handleNextBillingDateChange = useCallback((date: string) => {
    setNextBillingDate(date);
  }, []);

  const handleLineItemChange = useCallback(
    (productId: string) => {
      lineItems.map((line: Line) => {
        if (line.node.productId === productId) {
          setLineItemQuantity(String(line.node.quantity));
          setLineId(line.node.id);
        }
      });
      setLineItem(productId);
    },
    [lineItems],
  );

  const handleLineItemQuantityChange = useCallback((quantity: string) => {
    setLineItemQuantity(quantity);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setStatus(status);
  }, []);

  // Redirects
  const adminRedirect = (href: string) => {
    redirect.dispatch(Redirect.Action.ADMIN_PATH, href);
  };

  const appRedirect = () => {
    redirect.dispatch(Redirect.Action.APP, '/');
  };

  const productOptions = useMemo(() => {
    if (!data) return;
    return data.subscriptionContract.lines.edges.map((line: Line) => {
      const label = line.node.variantTitle
        ? `${line.node.title} - ${line.node.variantTitle}`
        : `${line.node.title}`;
      return {
        label: label,
        value: line.node.productId,
      };
    });
  }, [data]);

  if (loading) return <LoadingSubscription />;
  if (error) return <ErrorState err={error.message} />;

  if (data.subscriptionContract) {
    return (
      <Page
        breadcrumbs={[{ content: 'Dashboard', onAction: appRedirect }]}
        title="Edit Subscription"
        subtitle={`Subscription (${formatId(data.subscriptionContract.id)}) `}
        titleMetadata={
          <Badge status={data.subscriptionContract.status === 'ACTIVE' ? 'success' : 'warning'}>
            {data.subscriptionContract.status}
          </Badge>
        }
      >
        <Frame>
          <TitleBar title="Edit Subscription" />
          <Layout>
            <Layout.Section>
              <CustomerInformation data={data} />
            </Layout.Section>
            <Layout.Section>
              <SubscriptionInformation data={data} adminRedirect={adminRedirect} />
            </Layout.Section>
            <Layout.AnnotatedSection title="Status" description="Update Status">
              <Card sectioned>
                <Select
                  label="Status"
                  options={[
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Cancel', value: 'CANCELLED' },
                    { label: 'Pause', value: 'PAUSED' },
                  ]}
                  onChange={(status) => handleStatusChange(status)}
                  value={status}
                />
                <Stack distribution="trailing">
                  <UpdateSubscriptionButton
                    contractId={contractId}
                    input={{ status: status }}
                    lineId={null}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>

            <Layout.AnnotatedSection
              title="Interval"
              description="Update Interval and Interval Count"
            >
              <Card sectioned>
                <Select
                  label="Interval"
                  options={[
                    { label: 'Weekly', value: 'WEEK' },
                    { label: 'Monthly', value: 'MONTH' },
                  ]}
                  onChange={(value) => handleIntervalChange(value)}
                  value={interval}
                />
                <TextField
                  value={intervalCount}
                  onChange={(count) => handleIntervalCountChange(count)}
                  label="Interval Count"
                  type="number"
                  autoComplete=""
                />
                <Stack distribution="trailing">
                  <UpdateSubscriptionButton
                    contractId={contractId}
                    input={{
                      deliveryPolicy: {
                        interval: interval,
                        intervalCount: Number(intervalCount),
                      },
                      billingPolicy: {
                        interval: interval,
                        intervalCount: Number(intervalCount),
                      },
                    }}
                    lineId={null}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>

            <Layout.AnnotatedSection
              title="Next Billing Date"
              description="Change / Update Next Billing Date"
            >
              <Card sectioned>
                <TextField
                  value={nextBillingDate}
                  onChange={(nextBillingDate) => handleNextBillingDateChange(nextBillingDate)}
                  label="Next Billing Date"
                  type="date"
                  autoComplete=""
                />
                <Stack distribution="trailing">
                  <UpdateSubscriptionButton
                    contractId={contractId}
                    input={{ nextBillingDate: nextBillingDate }}
                    lineId={null}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection
              title="Product"
              description="Select Product to Update Quantity"
            >
              <Card sectioned>
                <Select
                  label="Item"
                  options={productOptions}
                  onChange={(lineItem) => handleLineItemChange(lineItem)}
                  value={lineItem}
                />
                <TextField
                  value={lineItemQuantity}
                  onChange={(lineItemQuantity) => handleLineItemQuantityChange(lineItemQuantity)}
                  label="Quantity"
                  type="number"
                  autoComplete=""
                />
                <Stack distribution="trailing">
                  <TextContainer>
                    * Removing item will remove all quantities of the selected item, to decrease the
                    quantity of the selected item, decrease quantity and update instead.
                  </TextContainer>
                  <UpdateSubscriptionButton
                    contractId={contractId}
                    input={{ quantity: Number(lineItemQuantity) }}
                    lineId={lineId}
                    lineItems={lineItems}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                  <RemoveLineFromSubscriptionButton
                    contractId={contractId}
                    lineId={lineId}
                    lineItems={lineItems}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection
              title="Payment Method"
              description="Send Update Payment Method Email"
            >
              <Card sectioned>
                <TextField
                  label="Payment Method ID"
                  disabled
                  value={paymentMethod}
                  autoComplete=""
                />
                <Stack distribution="trailing">
                  <UpdatePaymentMethodButton
                    id={paymentMethod}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection title="Address" description="Update Shipping Address">
              <Card sectioned>
                <TextField
                  label="Company"
                  type="text"
                  placeholder="Company"
                  onChange={(company) => setCompany(company)}
                  value={company}
                  autoComplete=""
                />
                <TextField
                  label="First Name"
                  type="text"
                  placeholder="First Name"
                  onChange={(firstName) => setFirstName(firstName)}
                  value={firstName}
                  autoComplete=""
                />
                <TextField
                  label="Last Name"
                  type="text"
                  placeholder="Last Name"
                  onChange={(lastName) => setLastName(lastName)}
                  value={lastName}
                  autoComplete=""
                />
                <TextField
                  label="Address 1"
                  type="text"
                  placeholder="Address1"
                  onChange={(address1) => setAddress1(address1)}
                  value={address1}
                  autoComplete=""
                />
                <TextField
                  label="Address 2"
                  type="text"
                  placeholder="Address2"
                  onChange={(address2) => setAddress2(address2)}
                  value={address2}
                  autoComplete=""
                />
                <TextField
                  label="City"
                  type="text"
                  placeholder="City"
                  onChange={(city) => setCity(city)}
                  value={city}
                  autoComplete=""
                />
                <TextField
                  label="Province"
                  type="text"
                  placeholder="Province"
                  onChange={(province) => setProvince(province)}
                  value={province}
                  autoComplete=""
                />
                <TextField
                  label="Country"
                  type="text"
                  placeholder="Country"
                  onChange={(country) => setCountry(country)}
                  value={country}
                  autoComplete=""
                />
                <TextField
                  label="Zip"
                  type="text"
                  placeholder="Zip"
                  onChange={(zip) => setZip(zip)}
                  value={zip}
                  autoComplete=""
                />
                <Stack distribution="trailing">
                  <UpdateSubscriptionButton
                    contractId={contractId}
                    input={{
                      deliveryMethod: {
                        shipping: {
                          address: {
                            company,
                            firstName,
                            lastName,
                            address1,
                            address2,
                            city,
                            province,
                            country,
                            zip,
                          },
                        },
                      },
                    }}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>
          </Layout>
          {toastMarkup}
        </Frame>
      </Page>
    );
  } else {
    return (
      <Page>
        <ErrorState err={`Subscription Contract (${id}) Not Found!`} />
      </Page>
    );
  }
}

export default EditSubscription;
