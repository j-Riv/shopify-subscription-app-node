/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState, useCallback, memo, useMemo } from 'react';
import { Button } from '@shopify/polaris';
import { useMutation } from '@apollo/client';
import {
  UPDATE_SUBSCRIPTION_CONTRACT,
  UPDATE_SUBSCRIPTION_DRAFT,
  UPDATE_SUBSCRIPTION_DRAFT_LINE,
  COMMIT_SUBSCRIPTION_DRAFT,
} from '../handlers';
import { calculateCurrentPrice, calculateDiscountRate } from '../utils/subscription-box';

interface Props {
  contractId: string;
  input: any;
  lineId?: string;
  lineItems?: any[];
  isSubscriptionBox?: boolean;
  toggleActive: () => void;
  setMsg: (msg: string) => void;
  setToastError: (error: boolean) => void;
  refetch: () => void;
}

const UpdateSubscriptionButton = ({
  contractId,
  input,
  lineId,
  lineItems,
  isSubscriptionBox,
  toggleActive,
  setMsg,
  setToastError,
  refetch,
}: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  // Update subscription contract -> draft id

  const [updateSubscriptionContract] = useMutation(UPDATE_SUBSCRIPTION_CONTRACT, {
    onCompleted: (data) => {
      if (lineId) {
        // if line items prop, recalculate total discount
        // get new prices
        let totalQuantity: number = 0;
        lineItems.forEach((line: any) => {
          if (line.node.id === lineId) {
            totalQuantity += input.quantity;
          } else {
            totalQuantity += line.node.quantity;
          }
        });

        const discountRate = calculateDiscountRate(totalQuantity, isSubscriptionBox);
        // get updated pricing per line
        const linesWithUpdatedPrices = lineItems.map((line: any) => {
          let quantity = line.node.id === lineId ? input.quantity : line.node.quantity;
          const computedPrice = calculateCurrentPrice(
            discountRate,
            line.node.pricingPolicy.basePrice.amount,
          );
          return {
            id: line.node.id,
            quantity: quantity,
            currentPrice: computedPrice,
            pricingPolicy: {
              basePrice: line.node.pricingPolicy.basePrice.amount,
              cycleDiscounts: {
                adjustmentType: 'PERCENTAGE',
                adjustmentValue: {
                  percentage: discountRate * 100,
                },
                afterCycle: 0,
                computedPrice: computedPrice,
              },
            },
          };
        });
        // update all lines with new pricing
        linesWithUpdatedPrices.forEach((line: any) =>
          updateDraftLine(data.subscriptionContractUpdate.draft.id, line.id, {
            quantity: line.quantity,
            currentPrice: line.currentPrice,
            pricingPolicy: line.pricingPolicy,
          }),
        );
        // updateDraftLine(data.subscriptionContractUpdate.draft.id, lineId, input);
      } else {
        updateDraft(data.subscriptionContractUpdate.draft.id, input);
      }
    },
  });
  // Update subscription draft -> draft id
  const [updateSubscriptionDraft] = useMutation(UPDATE_SUBSCRIPTION_DRAFT, {
    onCompleted: (data) => {
      try {
        if (data.subscriptionDraftUpdate.userErrors.length > 0) {
          setLoading(false);
          setToastError(true);
          setMsg(data.subscriptionDraftUpdate.userErrors[0].message);
          toggleActive();
        } else {
          setToastError(false);
          commitDraft(data.subscriptionDraftUpdate.draft.id);
        }
      } catch (e) {
        console.log('Error', e.message);
        setToastError(true);
        setMsg('Error Updating Subscription');
        toggleActive();
      }
    },
  });
  // Update subscription draft line -> draft id
  const [updateSubscriptionDraftLine] = useMutation(UPDATE_SUBSCRIPTION_DRAFT_LINE, {
    onCompleted: (data) => {
      try {
        if (data.subscriptionDraftLineUpdate.userErrors.length > 0) {
          setLoading(false);
          setToastError(true);
          setMsg(data.subscriptionDraftLineUpdate.userErrors[0].message);
          toggleActive();
        } else {
          setToastError(false);
          commitDraft(data.subscriptionDraftLineUpdate.draft.id);
        }
      } catch (e) {
        console.log('Error', e.message);
        setToastError(true);
        setMsg('Error Updating Subscription');
        toggleActive();
      }
    },
  });
  // Commit subscription draft -> update toast msg and make it active
  const [commitSubscriptionDraft] = useMutation(COMMIT_SUBSCRIPTION_DRAFT, {
    onCompleted: () => {
      try {
        setLoading(false);
        setMsg('Updated Subscription');
        toggleActive();
        refetch();
      } catch (e) {
        console.log('Error', e.message);
        setToastError(true);
        setMsg('Error Refetching Subscription');
        toggleActive();
      }
    },
  });

  const updateDraft = useMemo(
    () => (draftId: string, input: any) => {
      try {
        updateSubscriptionDraft({
          variables: {
            draftId: draftId,
            input: input,
          },
        });
      } catch (e) {
        console.log('Update Draft Error', e.message);
        setToastError(true);
        setMsg('Error Updating Subscription');
        toggleActive();
      }
    },
    [input],
  );

  const updateDraftLine = useMemo(
    () => (draftId: string, lineId: string, input: any) => {
      try {
        updateSubscriptionDraftLine({
          variables: {
            draftId: draftId,
            lineId: lineId,
            input: input,
          },
        });
      } catch (e) {
        console.log('Update Draft Error', e.message);
      }
    },
    [lineId, input],
  );

  const commitDraft = useMemo(
    () => (draftId: string) => {
      try {
        commitSubscriptionDraft({
          variables: {
            draftId: draftId,
          },
        });
      } catch (e) {
        console.log('Commit Draft Error', e.message);
      }
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClick = useCallback(() => {
    try {
      setLoading(true);
      updateSubscriptionContract({
        variables: {
          contractId: contractId,
        },
      });
    } catch (e) {
      console.log('Update Contract Error', e.message);
    }
  }, [contractId]);

  return (
    <Button primary loading={loading} onClick={() => handleClick()}>
      Update
    </Button>
  );
};

const MemoizedUpdateSubscriptionButton = memo(UpdateSubscriptionButton);

export default MemoizedUpdateSubscriptionButton;
