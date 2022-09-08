import { useState, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_SUBSCRIPTION_BY_ID, GET_SELLING_PLAN_GROUP_WITH_VARIANTS } from '../handlers';
import { Line } from '../types/subscriptions';

export function useSubscription(id: string) {
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

  const [itemToAdd, setItemToAdd] = useState<string>('');
  const [itemsToAdd, setItemsToAdd] = useState<any[]>([]);

  const getSellingPlanGroupId = (sellingPlanId: string, groups: any[]) => {
    // loop through groups and find group with id
    const found = groups.find((group) =>
      group.node.sellingPlans.edges.find((el) => el.node.id === sellingPlanId),
    );
    return found;
  };

  // query data
  // Get Selling Plan Data
  const [getSellingPlan, { data: sellingPlanData }] = useLazyQuery(
    GET_SELLING_PLAN_GROUP_WITH_VARIANTS,
  );
  // Get Data
  const {
    loading: subscriptionLoading,
    error: subscriptionError,
    data: subscriptionData,
    refetch: subscriptionRefetch,
  } = useQuery(GET_SUBSCRIPTION_BY_ID, {
    variables: {
      id: `gid://shopify/SubscriptionContract/${id}`,
    },
    onCompleted: (data) => {
      if (data.subscriptionContract) {
        const d = data.subscriptionContract;
        unstable_batchedUpdates(() => {
          if (d.status) setStatus(d.status);
          if (d.id) setContractId(d.id);
          if (d.billingPolicy.interval) setInterval(d.billingPolicy.interval);
          if (d.billingPolicy.intervalCount)
            setIntervalCount(String(d.billingPolicy.intervalCount));
          if (d.nextBillingDate.split('T')[0]) setNextBillingDate(d.nextBillingDate.split('T')[0]);
          if (d.lines.edges[0].node.variantId) setLineItem(d.lines.edges[0].node.variantId);
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

        const sellingPlanId = data.subscriptionContract.lines.edges[0].node.sellingPlanId;
        const sellingPlanGroup = getSellingPlanGroupId(sellingPlanId, data.sellingPlanGroups.edges);
        getSellingPlan({
          variables: {
            id: sellingPlanGroup.node.id,
          },
          onCompleted: (data) => {
            // set first available variant
            const excludeItems = d.lines.edges.map((el: any) => el.node.variantId);
            const filteredItems = data.sellingPlanGroup.productVariants.edges.filter(
              (el: any) =>
                el.node.sellableOnlineQuantity >= 1 && !excludeItems.includes(el.node.id),
            );
            // set first available if there's a variant to set
            if (filteredItems.length > 0) {
              const firstVariant = filteredItems[0].node.id;
              setItemToAdd(firstVariant);
            }
          },
        });
      }
    },
  });

  useEffect(() => {
    if (!sellingPlanData) return;
    // update items to add when line items changes
    // exclude items already in subscription
    const excludeItems = lineItems.map((el: any) => el.node.variantId);
    const filteredItems = sellingPlanData.sellingPlanGroup.productVariants.edges.filter(
      (el: any) => el.node.sellableOnlineQuantity >= 1 && !excludeItems.includes(el.node.id),
    );
    setItemsToAdd(filteredItems);
  }, [sellingPlanData, lineItems]);

  // handlers
  const handleIntervalChange = (value: string) => setInterval(value);

  const handleIntervalCountChange = (value: string) => setIntervalCount(value);

  const handleNextBillingDateChange = (date: string) => setNextBillingDate(date);

  const handleLineItemChange = (variantId: string) => {
    lineItems.forEach((line: Line) => {
      if (line.node.variantId === variantId) {
        setLineItemQuantity(String(line.node.quantity));
        setLineId(line.node.id);
      }
    });
    setLineItem(variantId);
  };

  const handleLineItemQuantityChange = (value: string) => setLineItemQuantity(value);

  const handleStatusChange = (value: string) => setStatus(value);

  const handleCompanyChange = (value: string) => setCompany(value);

  const handleFirstNameChange = (value: string) => setFirstName(value);

  const handleLastNameChange = (value: string) => setLastName(value);

  const handleAddress1Change = (value: string) => setAddress1(value);

  const handleAddress2Change = (value: string) => setAddress2(value);

  const handleCityChange = (value: string) => setCity(value);

  const handleProvinceChange = (value: string) => setProvince(value);

  const handleCountryChange = (value: string) => setCountry(value);

  const handleZipChange = (value: string) => setZip(value);

  const handleItemToAddChange = (value: string) => setItemToAdd(value);

  return {
    // data
    subscriptionLoading,
    subscriptionError,
    subscriptionData,
    subscriptionRefetch,
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
    lineItems,
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
    itemsToAdd,
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
  };
}
