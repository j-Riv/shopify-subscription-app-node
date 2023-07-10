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
import serverUrl from './server-url';

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
  const [planTitle, setPlanTitle] = useState<string>('');
  const [percentageOff, setPercentageOff] = useState<string>('5');
  const [merchantCode, setMerchantCode] = useState<string>('');
  const [planGroupOption, setPlanGroupOption] = useState<string>('');
  const [intervalOption, setIntervalOption] = useState<string>('WEEK');
  const [numberOfPlans, setNumberOfPlans] = useState<string>('1');
  const [intervalCount, setIntervalCount] = useState<string>('1');

  const onPrimaryAction = useCallback(async () => {
    const token = await getSessionToken();

    // Here, send the form data to your app server to create the new plan.
    // The product and variant ID's collected from the modal form.
    interface CreatePayload {
      productId: string;
      variantId?: string;
      planTitle: string;
      percentageOff: string;
      merchantCode: string;
      intervalOption: string;
      numberOfPlans: string;
      intervalCount: string;
      planGroupOption: string;
    }

    let payload: CreatePayload = {
      productId: data.productId,
      variantId: data.variantId,
      planTitle: planTitle,
      percentageOff: percentageOff,
      merchantCode: merchantCode,
      intervalOption: intervalOption,
      numberOfPlans: numberOfPlans,
      intervalCount: intervalCount,
      planGroupOption: planGroupOption,
    };

    // Send the form data to your app server to create the new plan.
    const response = await fetch(`${serverUrl}/subscription-plan/create`, {
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
    done,
    planTitle,
    percentageOff,
    merchantCode,
    intervalOption,
    numberOfPlans,
    intervalCount,
    planGroupOption,
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

  return (
    <>
      <BlockStack spacing="none">
        <Text size="large">Create Subscription Plan</Text>
      </BlockStack>

      {error && (
        <Text appearance="critical">
          There has been a problem, please try again later...
        </Text>
      )}

      <Card title="Create a Subscription Plan" sectioned>
        <TextField
          label="Plan Title"
          value={planTitle}
          onChange={setPlanTitle}
        />
        <TextField
          label="Merchant Code"
          value={merchantCode}
          onChange={setMerchantCode}
        />
        <TextField
          label="Options"
          value={planGroupOption}
          onChange={setPlanGroupOption}
        />
      </Card>

      <Card title="Delivery and Discount" sectioned>
        <BlockStack>
          <Select
            label="Number of Plans"
            options={[
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ]}
            onChange={setNumberOfPlans}
            value={numberOfPlans}
          />
          <Select
            label="Interval"
            options={[
              {
                label: 'Daily',
                value: 'DAY',
              },
              {
                label: 'Weekly',
                value: 'WEEK',
              },
              {
                label: 'Monthly',
                value: 'MONTH',
              },
              {
                label: 'Yearly',
                value: 'YEAR',
              },
            ]}
            onChange={setIntervalOption}
            value={intervalOption}
          />
          <Select
            label="Interval Count"
            options={[
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ]}
            onChange={setIntervalCount}
            value={intervalCount}
          />
          <TextField
            type="number"
            label="Percentage Off (%)"
            value={percentageOff}
            onChange={setPercentageOff}
          />
        </BlockStack>
      </Card>
      {cachedActions}
    </>
  );
}

export default Create;
