import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Badge,
  Card,
  Frame,
  Layout,
  Page,
  Select,
  Stack,
  TextField,
  TextStyle,
} from '@shopify/polaris';
import { TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { formatId } from '../utils/formatters';
import LoadingSubscription from '../components/LoadingSubscription';
import ErrorState from '../components/ErrorState';
import CustomerInformation from '../components/CustomerInformation';
import SubscriptionInformation from '../components/SubscriptionInformation';
import UpdateSubscriptionButton from '../components/UpdateSubscriptionButton';
import RemoveLineFromSubscriptionButton from '../components/RemoveLineFromSubscriptionButton';
import AddLineToSubscriptionButton from '../components/AddLineToSubscriptionButton';
import UpdatePaymentMethodButton from '../components/UpdatePaymentMethodButton';
import { Line } from '../types/subscriptions';
import { useSubscription, useToast } from '../hooks';

function EditSubscription() {
  // Get id from path
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  // Create redirects
  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const {
    // data
    loading,
    error,
    data,
    refetch,
    sellingPlanData,
    // state
    status,
    contractId,
    interval,
    intervalCount,
    nextBillingDate,
    lineItem,
    lineId,
    lineItemQuantity,
    paymentMethod,
    company,
    firstName,
    lastName,
    address1,
    address2,
    city,
    country,
    province,
    zip,
    itemToAdd,
    // handlers
    handleCompanyChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleAddress1Change,
    handleAddress2Change,
    handleCityChange,
    handleProvinceChange,
    handleCountryChange,
    handleZipChange,
    handleIntervalChange,
    handleIntervalCountChange,
    handleNextBillingDateChange,
    handleLineItemChange,
    handleLineItemQuantityChange,
    handleStatusChange,
    handleItemToAddChange,
  } = useSubscription(id);

  const { toggleActive, setMsg, setToastError, toastMarkup } = useToast();

  // Exit if no id
  if (!id)
    return (
      <div>
        <TextStyle variation="negative">Error! No Subscription Contract ID Supplied.</TextStyle>
      </div>
    );

  // Redirects
  const adminRedirect = (href: string) => {
    redirect.dispatch(Redirect.Action.ADMIN_PATH, href);
  };

  const appRedirect = () => {
    redirect.dispatch(Redirect.Action.APP, '/');
  };

  if (loading) return <LoadingSubscription />;
  if (error) return <ErrorState err={error.message} />;

  console.log('sellingplandata', sellingPlanData?.sellingPlanGroup);

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
                  onChange={(value) => handleIntervalCountChange(value)}
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
                  onChange={(value) => handleNextBillingDateChange(value)}
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
                  options={data.subscriptionContract.lines.edges.map((line: Line) => {
                    const label = line.node.variantTitle
                      ? `${line.node.title} - ${line.node.variantTitle}`
                      : `${line.node.title}`;
                    return {
                      label: label,
                      value: line.node.productId,
                    };
                  })}
                  onChange={handleLineItemChange}
                  value={lineItem}
                />
                <TextField
                  value={lineItemQuantity}
                  onChange={handleLineItemQuantityChange}
                  label="Quantity"
                  type="number"
                  autoComplete=""
                />
                <Stack distribution="trailing">
                  <UpdateSubscriptionButton
                    contractId={contractId}
                    input={{ quantity: Number(lineItemQuantity) }}
                    lineId={lineId}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                  <RemoveLineFromSubscriptionButton
                    contractId={contractId}
                    lineId={lineId}
                    toggleActive={toggleActive}
                    setMsg={setMsg}
                    setToastError={setToastError}
                    refetch={refetch}
                  />
                </Stack>
              </Card>
            </Layout.AnnotatedSection>
            <Layout.AnnotatedSection title="Add Product" description="Select Product to Add">
              <Card sectioned>
                {sellingPlanData?.sellingPlanGroup?.productVariants && (
                  <>
                    <Select
                      label="Item to Add"
                      options={sellingPlanData.sellingPlanGroup.productVariants.edges
                        .filter((el: any) => el.node.sellableOnlineQuantity >= 1)
                        .map((el: any) => {
                          console.log('NODE', el.node);
                          return {
                            label: `${el.node.sku} - ${el.node.product.title} - ${el.node.title}`,
                            value: el.node.id,
                          };
                        })}
                      onChange={handleItemToAddChange}
                      value={itemToAdd}
                    />
                    <Stack distribution="trailing">
                      <AddLineToSubscriptionButton
                        contractId={contractId}
                        input={{
                          customAttributes:
                            data.subscriptionContract.lines.edges[0].customAttributes,
                          sellingPlanId: data.subscriptionContract.lines.edges[0].sellingPlanId,
                          sellingPlanGroup:
                            data.subscriptionContract.lines.edges[0].sellingPlanName,
                          quantity: 1,
                          productVariantId: itemToAdd,
                          // currentPrice: '',
                          // pricingPolicy: {
                          //   basePrice: '11.99',
                          //   cycleDiscounts: {
                          //     adjustmentType: 'PERCENTAGE',
                          //     adjustmentValue: {
                          //       percentage: 10,
                          //     },
                          //     afterCycle: 0,
                          //     computedPrice: '10.79',
                          //   },
                          // },
                        }}
                        itemToAdd={itemToAdd}
                        productVariants={sellingPlanData.sellingPlanGroup.productVariants.edges}
                        toggleActive={toggleActive}
                        setMsg={setMsg}
                        setToastError={setToastError}
                        refetch={refetch}
                      />
                    </Stack>
                  </>
                )}
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
                  onChange={handleCompanyChange}
                  value={company}
                  autoComplete=""
                />
                <TextField
                  label="First Name"
                  type="text"
                  placeholder="First Name"
                  onChange={handleFirstNameChange}
                  value={firstName}
                  autoComplete=""
                />
                <TextField
                  label="Last Name"
                  type="text"
                  placeholder="Last Name"
                  onChange={handleLastNameChange}
                  value={lastName}
                  autoComplete=""
                />
                <TextField
                  label="Address 1"
                  type="text"
                  placeholder="Address1"
                  onChange={handleAddress1Change}
                  value={address1}
                  autoComplete=""
                />
                <TextField
                  label="Address 2"
                  type="text"
                  placeholder="Address2"
                  onChange={handleAddress2Change}
                  value={address2}
                  autoComplete=""
                />
                <TextField
                  label="City"
                  type="text"
                  placeholder="City"
                  onChange={handleCityChange}
                  value={city}
                  autoComplete=""
                />
                <TextField
                  label="Province"
                  type="text"
                  placeholder="Province"
                  onChange={handleProvinceChange}
                  value={province}
                  autoComplete=""
                />
                <TextField
                  label="Country"
                  type="text"
                  placeholder="Country"
                  onChange={handleCountryChange}
                  value={country}
                  autoComplete=""
                />
                <TextField
                  label="Zip"
                  type="text"
                  placeholder="Zip"
                  onChange={handleZipChange}
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
