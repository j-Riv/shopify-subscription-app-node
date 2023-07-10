import React, { useEffect, useMemo } from 'react';
import {
  Text,
  useData,
  useContainer,
  useLocale,
  useSessionToken,
} from '@shopify/admin-ui-extensions-react';
import { Translations, translations } from './config';
import serverUrl from './server-url';

// 'Remove' mode should remove the current product from a selling plan.
// This should not delete the selling plan.
// [Shopify admin renders this mode inside a modal container]
function Remove() {
  const data = useData<'Admin::Product::SubscriptionPlan::Remove'>();
  const { close, done, setPrimaryAction, setSecondaryAction } =
    useContainer<'Admin::Product::SubscriptionPlan::Remove'>();
  const locale = useLocale();
  const localizedStrings: Translations = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const { getSessionToken } = useSessionToken();

  useEffect(() => {
    setPrimaryAction({
      content: 'Remove From Plan',
      onAction: async () => {
        const token = await getSessionToken();
        // Here, send the form data to your app server to remove the product from the plan.
        // The product ID, variant ID, variantIds, and the selling plan group ID
        interface RemovePayload {
          sellingPlanGroupId: string;
          productId: string;
          variantId?: string;
          variantIds?: string[];
        }

        let payload: RemovePayload = {
          sellingPlanGroupId: data.sellingPlanGroupId,
          productId: data.productId,
          variantId: data.variantId,
          variantIds: data.variantIds,
        };

        const response = await fetch(
          `${serverUrl}/subscription-plan/product/remove`,
          {
            method: 'POST',
            headers: {
              'X-SUAVESCRIBE-TOKEN': token || 'unknown token',
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        // If the server responds with an OK status, then refresh the UI and close the modal
        if (response.ok) {
          done();
        } else {
          console.log('Handle error.');
        }

        close();
      },
    });

    setSecondaryAction({
      content: 'Cancel',
      onAction: () => close(),
    });
  }, [getSessionToken, done, close, setPrimaryAction, setSecondaryAction]);

  return (
    <>
      <Text>
        Remove Product id {data.productId} from Plan group id{' '}
        {data.sellingPlanGroupId}
      </Text>
    </>
  );
}

export default Remove;
