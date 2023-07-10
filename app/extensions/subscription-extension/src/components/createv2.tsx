import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  TextField,
  Text,
  Select,
  BlockStack,
  useData,
  useContainer,
  useLocale,
  useSessionToken,
} from '@shopify/admin-ui-extensions-react';
import Actions from './actions';
import { Translations, translations } from './config';
import SellingPlanForm from './sellingPlanForm';
import serverUrl from './server-url';
import { SellingPlan } from '../types/sellingplans';

// 'Create' mode should create a new selling plan, and add the current product to it
// [Shopify admin renders this mode inside an app overlay container]
function Create() {
  const data = useData<'Admin::Product::SubscriptionPlan::Create'>();
  const { close, done } =
    useContainer<'Admin::Product::SubscriptionPlan::Create'>();

  const locale = useLocale();
  const localizedStrings: Translations = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const { getSessionToken } = useSessionToken();

  // Mock plan settings
  const [error, setError] = useState<boolean>(false);
  const [planGroupName, setPlanGroupName] = useState<string>('');
  const [merchantCode, setMerchantCode] = useState<string>('');
  const [planGroupOption, setPlanGroupOption] = useState<string>('');
  const [planGroupDescription, setPlanGroupDescription] = useState<string>('');
  const [numberOfPlans, setNumberOfPlans] = useState<string>('1');

  let sellingPlanInitialState: { [key: number]: SellingPlan } = {};
  for (let i = 1; i <= 10; i++) {
    sellingPlanInitialState[i] = {
      id: i,
      intervalCount: '1',
      intervalOption: 'MONTH',
      percentageOff: '5',
    };
  }

  const [sellingPlans, setSellingPlans] = useState<any>(
    sellingPlanInitialState
  );

  const handleSellingPlans = (id: number, sellingPlan: SellingPlan) => {
    sellingPlans[id] = sellingPlan;
    setSellingPlans(sellingPlans);
  };

  const generateSellingPlans = () => {
    const plans: { [key: number]: SellingPlan } = {};
    for (let i = 1; i <= parseInt(numberOfPlans); i++) {
      plans[i] = sellingPlans[i];
    }
    return plans;
  };

  const onPrimaryAction = useCallback(async () => {
    const token = await getSessionToken();
    const plans = generateSellingPlans();

    // Here, send the form data to your app server to create the new plan.
    // The product and variant ID's collected from the modal form.
    interface CreatePayload {
      productId: string;
      variantId?: string;
      planGroupName: string;
      merchantCode: string;
      planGroupOption: string;
      planGroupDescription: string;
      numberOfPlans: string;
      sellingPlans: { [key: number]: SellingPlan };
    }

    let payload: CreatePayload = {
      productId: data.productId,
      variantId: data.variantId,
      planGroupName: planGroupName,
      merchantCode: merchantCode,
      planGroupOption: planGroupOption,
      planGroupDescription: planGroupDescription,
      numberOfPlans: numberOfPlans,
      sellingPlans: plans,
    };

    console.log('PAYLOAD ===>', payload);
    // Send the form data to your app server to create the new plan.
    const response = await fetch(`${serverUrl}/subscription-plan/v2/create`, {
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
      console.log(response);
      setError(true);
    }

    close();
  }, [
    getSessionToken,
    done,
    planGroupName,
    merchantCode,
    numberOfPlans,
    planGroupOption,
    sellingPlans,
  ]);

  const cachedActions = useMemo(
    () => (
      <Actions
        onPrimary={onPrimaryAction}
        onClose={close}
        title="Create plan"
      />
    ),
    [onPrimaryAction, close]
  );

  // selling plan component

  return (
    <>
      <BlockStack spacing="none">
        <Text size="large">Create Subscription Plan Group</Text>
      </BlockStack>

      {error && (
        <Text appearance="critical">
          There has been a problem, please try again later...
        </Text>
      )}

      <Card title="Subscription Plan Group" sectioned>
        <TextField
          label="Group Name"
          value={planGroupName}
          onChange={setPlanGroupName}
        />
        <TextField
          label="Merchant Code"
          value={merchantCode}
          onChange={setMerchantCode}
        />
        <TextField
          label="Description"
          value={planGroupDescription}
          onChange={setPlanGroupDescription}
        />
        <TextField
          label="Options"
          value={planGroupOption}
          onChange={setPlanGroupOption}
        />
      </Card>

      <Card title="Generate Plans" sectioned>
        <BlockStack>
          <Select
            label="Number of Plans"
            options={[
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
              { label: '5', value: '5' },
              { label: '6', value: '6' },
              { label: '7', value: '7' },
              { label: '8', value: '8' },
              { label: '9', value: '9' },
              { label: '10', value: '10' },
            ]}
            onChange={setNumberOfPlans}
            value={numberOfPlans}
          />
        </BlockStack>
      </Card>

      <Card title="Selling Plans" sectioned>
        {Array.from({ length: parseInt(numberOfPlans) }, (_, i) => i + 1).map(
          (n: number) => (
            <SellingPlanForm
              index={n}
              handleSellingPlans={handleSellingPlans}
            />
          )
        )}
      </Card>

      {cachedActions}
    </>
  );
}

export default Create;
