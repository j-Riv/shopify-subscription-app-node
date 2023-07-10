import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  TextField,
  Text,
  Select,
  Spinner,
  BlockStack,
  useData,
  useContainer,
  useLocale,
  useSessionToken,
} from '@shopify/admin-ui-extensions-react';
import Actions from './actions';
import { Translations, translations } from './config';
import EditSellingPlanForm from './editSellingPlanForm';
import serverUrl from './server-url';

// 'Edit' mode should modify an existing selling plan.
// Changes should affect other products that have this plan applied.
// [Shopify admin renders this mode inside an app overlay container]
function Edit() {
  const data = useData<'Admin::Product::SubscriptionPlan::Edit'>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [sellingPlans, setSellingPlans] = useState<any>();
  const [sellingPlanIds, setSellingPlanIds] = useState<string[]>();
  const [planGroupName, setPlanGroupName] = useState<string>();
  const [planGroupDescription, setPlanGroupDescription] = useState<string>();
  const [merchantCode, setMerchantCode] = useState<string>();
  const [planGroupOption, setPlanGroupOption] = useState<string>();
  const locale = useLocale();
  const localizedStrings: Translations = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const { getSessionToken } = useSessionToken();

  const { close, done } =
    useContainer<'Admin::Product::SubscriptionPlan::Edit'>();

  // Get Plan to Edit
  const getCurrentPlan = async () => {
    const token = await getSessionToken();
    let payload = {
      sellingPlanGroupId: data.sellingPlanGroupId,
      productId: data.productId,
      variantId: data.variantId,
    };
    const response = await fetch(`${serverUrl}/subscription-plan/get`, {
      method: 'POST',
      headers: {
        'X-SUAVESCRIBE-TOKEN': token || 'unknown token',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const selectedPlan = await response.json();

    // set title for now
    // still need to figure out how to grab selling plans
    // set state
    setPlanGroupName(selectedPlan.name);
    setPlanGroupDescription(selectedPlan.description);
    setMerchantCode(selectedPlan.merchantCode);
    setPlanGroupOption(selectedPlan.options[0]);
    let sellingPlanInitialState = {};
    selectedPlan.sellingPlans.edges.forEach((plan: any) => {
      sellingPlanInitialState[plan.node.id] = {
        id: plan.node.id,
        intervalCount: plan.node.deliveryPolicy.intervalCount.toString(),
        intervalOption: plan.node.deliveryPolicy.interval,
        percentageOff:
          plan.node.pricingPolicies[0].adjustmentValue.percentage.toString(),
      };
    });
    setSellingPlans(sellingPlanInitialState);
    setSellingPlanIds(Object.keys(sellingPlanInitialState));
    setLoading(false);
  };

  useEffect(() => {
    getCurrentPlan();
  }, []);

  useEffect(() => {
    console.log('VALUES HAVE CHANGED');
  }, [
    sellingPlans,
    sellingPlanIds,
    planGroupName,
    planGroupDescription,
    planGroupOption,
    merchantCode,
  ]);

  const handlePlanGroupName = (name: string) => {
    setPlanGroupName(name);
  };

  const handlePlanGroupDescription = (description: string) => {
    setPlanGroupDescription(description);
  };

  const handleMerchantCode = (merchantCode: string) => {
    setMerchantCode(merchantCode);
  };

  const handleSellingPlans = (id: string, sellingPlan: any) => {
    sellingPlans[id] = sellingPlan;
    setSellingPlans(sellingPlans);
  };

  const generateSellingPlans = () => {
    const plans = [];
    sellingPlanIds.forEach((planId: string) => {
      plans.push(sellingPlans[planId]);
    });

    return plans;
  };

  const onPrimaryAction = useCallback(async () => {
    const token = await getSessionToken();
    const plans = generateSellingPlans();

    // Here, send the form data to your app server to modify the selling plan.
    // The product ID and variant ID collected from the modal form and the selling plan group ID
    interface EditPayload {
      sellingPlanGroupId: string;
      productId: string;
      variantId?: string;
      planGroupName: string;
      planGroupDescription: string;
      merchantCode: string;
      planGroupOption: string;
      sellingPlans: any[];
    }

    let payload: EditPayload = {
      sellingPlanGroupId: data.sellingPlanGroupId,
      productId: data.productId,
      variantId: data.variantId,
      planGroupName: planGroupName,
      planGroupDescription: planGroupDescription,
      merchantCode: merchantCode,
      planGroupOption: planGroupOption,
      sellingPlans: plans,
    };

    console.log('PAYLOAD', payload);

    // Here, send the form data to your app server to add the product to an existing plan.
    const response = await fetch(`${serverUrl}/subscription-plan/edit`, {
      method: 'POST',
      headers: {
        'X-SUAVESCRIBE-TOKEN': token || 'unknown token',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // If the server responds with an OK status, then refresh the UI and close the modal
    if (response.ok) {
      done();
    } else {
      console.log('Handle error.');
      setError(true);
    }
    close();
  }, [
    getSessionToken,
    generateSellingPlans,
    done,
    planGroupName,
    planGroupDescription,
    merchantCode,
    planGroupOption,
    sellingPlanIds,
    sellingPlans,
  ]);

  const cachedActions = useMemo(
    () => (
      <Actions
        onPrimary={onPrimaryAction}
        onClose={close}
        title="Edit Plan Group"
      />
    ),
    [onPrimaryAction, close]
  );

  return (
    <>
      <BlockStack spacing="none">
        <Text size="large">
          Edit Subscription Plan Group ({data.sellingPlanGroupId})
        </Text>
      </BlockStack>

      {error && (
        <Text appearance="critical">
          There has been a problem, please try again later...
        </Text>
      )}

      {loading ? (
        <Card sectioned>
          <Spinner />
        </Card>
      ) : (
        <>
          <Card
            title={`Edit subscription plan group attached to Product id ${data.productId}`}
            sectioned
          >
            <TextField
              label="Group Name"
              value={planGroupName}
              onChange={value => handlePlanGroupName(value)}
            />
            <TextField
              label="Merchant Code"
              value={merchantCode}
              onChange={value => {
                handleMerchantCode(value);
              }}
            />
            <TextField
              label="Description"
              value={planGroupDescription}
              onChange={value => handlePlanGroupDescription(value)}
            />
            <TextField
              label="Options"
              value={planGroupOption}
              onChange={setPlanGroupOption}
            />
          </Card>
          <Card title="Selling Plans" sectioned>
            {sellingPlanIds.map((planId: string) => {
              const plan = sellingPlans[planId];
              return (
                <EditSellingPlanForm
                  key={planId}
                  handleSellingPlans={handleSellingPlans}
                  planId={planId}
                  initialIntervalOption={plan.intervalOption}
                  initialIntervalCount={plan.intervalCount}
                  initialPercentageOff={plan.percentageOff}
                />
              );
            })}
          </Card>
        </>
      )}

      {cachedActions}
    </>
  );
}

export default Edit;
