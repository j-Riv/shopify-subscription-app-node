import React, { useState } from 'react';
import {
  CardSection,
  TextField,
  Text,
  Select,
  BlockStack,
} from '@shopify/admin-ui-extensions-react';

function SellingPlanForm({ index, handleSellingPlans }) {
  const [intervalOption, setIntervalOption] = useState<string>('MONTH');
  const [intervalCount, setIntervalCount] = useState<string>('1');
  const [percentageOff, setPercentageOff] = useState<string>('5');

  const handleIntervalCount = (count: string) => {
    setIntervalCount(count);
    handleSellingPlans(index, {
      id: index,
      intervalCount: count,
      intervalOption,
      percentageOff,
    });
  };

  const handleIntervalOption = (interval: string) => {
    setIntervalOption(interval);
    handleSellingPlans(index, {
      id: index,
      intervalCount,
      intervalOption: interval,
      percentageOff,
    });
  };

  const handlePercentageOff = (percent: string) => {
    setPercentageOff(percent);
    handleSellingPlans(index, {
      id: index,
      intervalCount,
      intervalOption,
      percentageOff: percent,
    });
  };

  return (
    <CardSection title={`Selling Plan ${index}`}>
      <Text size="small" emphasized appearance="subdued">
        The selling plan name will automatically be generated based on interval,
        interval count and discount percentage.
      </Text>
      <BlockStack>
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
          onChange={value => handleIntervalOption(value)}
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
          onChange={value => handleIntervalCount(value)}
          value={intervalCount}
        />
        <TextField
          type="number"
          label="Percentage Off (%)"
          value={percentageOff}
          onChange={value => handlePercentageOff(value)}
        />
      </BlockStack>
    </CardSection>
  );
}

export default SellingPlanForm;
