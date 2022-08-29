/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState, useCallback, memo } from 'react';
import { Button } from '@shopify/polaris';
import { useMutation } from '@apollo/client';
import {
  UPDATE_SUBSCRIPTION_CONTRACT,
  UPDATE_SUBSCRIPTION_DRAFT_LINE,
  REMOVE_SUBSCRIPTION_DRAFT_LINE,
  COMMIT_SUBSCRIPTION_DRAFT,
} from '../handlers';

interface Props {
  contractId: string;
  lineId?: string;
  lineItems?: any[];
  isSubscriptionBox: boolean;
  toggleActive: () => void;
  setMsg: (msg: string) => void;
  setToastError: (error: boolean) => void;
  refetch: () => void;
}

const calculateCurrentPrice = (discountRate: number, currentPrice: string) => {
  const price = parseFloat(currentPrice);
  const amount = (price - price * discountRate).toFixed(2);
  return String(amount);
};

const RemoveLineFromSubscriptionButton = ({
  contractId,
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
  // if line items prop, recalculate total discount
  // get new prices
  let totalQuantity: number = 0;
  lineItems.forEach((line: any) => {
    if (lineId !== line.node.id) totalQuantity += line.node.quantity;
  });
  // move this to constant later
  let discountRate: number = 0;
  if (isSubscriptionBox) {
    if (totalQuantity >= 5) {
      discountRate = 0.2;
    } else if (totalQuantity >= 4) {
      discountRate = 0.15;
    } else if (totalQuantity >= 3) {
      discountRate = 0.1;
    } else {
      discountRate = 0;
    }
  }
  // get updated pricing per line
  const linesWithUpdatedPrices: any[] = [];
  lineItems.forEach((line: any) => {
    if (lineId !== line.node.id)
      linesWithUpdatedPrices.push({
        id: line.node.id,
        quantity: line.node.quantity,
        currentPrice: calculateCurrentPrice(discountRate, line.node.pricingPolicy.basePrice.amount),
      });
  });
  const [updateSubscriptionContract] = useMutation(UPDATE_SUBSCRIPTION_CONTRACT, {
    onCompleted: (data) => {
      if (lineId) {
        linesWithUpdatedPrices.forEach((line: any) =>
          updateDraftLine(data.subscriptionContractUpdate.draft.id, line.id, {
            quantity: line.quantity,
            currentPrice: line.currentPrice,
          }),
        );
        removeDraftLine(data.subscriptionContractUpdate.draft.id, lineId);
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
  const [removeSubscriptionDraftLine] = useMutation(REMOVE_SUBSCRIPTION_DRAFT_LINE, {
    onCompleted: (data) => {
      try {
        if (data.subscriptionDraftLineRemove.userErrors.length > 0) {
          setLoading(false);
          setToastError(true);
          setMsg(data.subscriptionDraftLineUpdate.userErrors[0].message);
          toggleActive();
        } else {
          setToastError(false);
          commitDraft(data.subscriptionDraftLineRemove.draft.id);
        }
      } catch (e) {
        console.log('Error', e.message);
        setToastError(true);
        setMsg('Error Removing Line Item From Subscription');
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

  const removeDraftLine = (draftId: string, lineId: string) => {
    try {
      removeSubscriptionDraftLine({
        variables: {
          draftId: draftId,
          lineId: lineId,
        },
      });
    } catch (e) {
      console.log('Remove Draft Line Error', e.message);
    }
  };

  const updateDraftLine = (draftId: string, lineId: string, input: any) => {
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
  };

  const commitDraft = (draftId: string) => {
    try {
      commitSubscriptionDraft({
        variables: {
          draftId: draftId,
        },
      });
    } catch (e) {
      console.log('Commit Draft Error', e.message);
    }
  };

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
      Remove
    </Button>
  );
};
const MemoizedRemoveLineFromSubscriptionButton = memo(RemoveLineFromSubscriptionButton);

export default MemoizedRemoveLineFromSubscriptionButton;
