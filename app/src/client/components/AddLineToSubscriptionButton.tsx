/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState, useMemo } from 'react';
import { Button } from '@shopify/polaris';
import { useMutation } from '@apollo/client';
import {
  UPDATE_SUBSCRIPTION_CONTRACT,
  ADD_SUBSCRIPTION_DRAFT_LINE,
  UPDATE_SUBSCRIPTION_DRAFT_LINE,
  COMMIT_SUBSCRIPTION_DRAFT,
} from '../handlers';
import { calculateCurrentPrice, calculateDiscountRate } from '../utils/subscription-box';

interface Props {
  contractId: string;
  input: any;
  lineItems?: any[];
  isSubscriptionBox?: boolean;
  toggleActive: () => void;
  setMsg: (msg: string) => void;
  setToastError: (error: boolean) => void;
  refetch: () => void;
  itemToAdd: string;
  productVariants: any[];
}

const AddLineToSubscriptionButton = ({
  contractId,
  input,
  lineItems,
  isSubscriptionBox,
  toggleActive,
  setMsg,
  setToastError,
  refetch,
  itemToAdd,
  productVariants,
}: Props) => {
  const [loading, setLoading] = useState<boolean>(false);

  // Update subscription contract -> draft id
  const [updateSubscriptionContract] = useMutation(UPDATE_SUBSCRIPTION_CONTRACT, {
    onCompleted: (data) => {
      // add new line here
      // if line items prop, recalculate total discount
      // get new prices
      let totalQuantity: number = 0;
      lineItems.forEach((line: any) => (totalQuantity += line.node.quantity));
      totalQuantity += input.quantity;
      const discountRate = calculateDiscountRate(totalQuantity, isSubscriptionBox);
      // get updated pricing per line
      const linesWithUpdatedPrices = lineItems.map((line: any) => {
        const computedPrice = calculateCurrentPrice(
          discountRate,
          line.node.pricingPolicy.basePrice.amount,
        );
        return {
          id: line.node.id,
          quantity: line.node.quantity,
          currentPrice: computedPrice,
          cycleDiscounts: {
            adjustmentType: 'PERCENTAGE',
            adjustmentValue: {
              percentage: discountRate * 100,
            },
            afterCycle: 0,
            computedPrice: computedPrice,
          },
        };
      });
      // update all lines with new pricing
      linesWithUpdatedPrices.forEach((line: any) =>
        updateDraftLine(data.subscriptionContractUpdate.draft.id, line.id, {
          quantity: line.quantity,
          currentPrice: line.currentPrice,
        }),
      );
      const productVariant = productVariants.find((el: any) => el.node.id === itemToAdd);
      const itemAddedComputedPrice = calculateCurrentPrice(discountRate, productVariant.node.price);
      input.currentPrice = itemAddedComputedPrice;
      input.pricingPolicy = {
        basePrice: productVariant.node.price,
        cycleDiscounts: {
          adjustmentType: 'PERCENTAGE',
          adjustmentValue: {
            percentage: discountRate * 100,
          },
          afterCycle: 0,
          computedPrice: itemAddedComputedPrice,
        },
      };
      addDraftLine(data.subscriptionContractUpdate.draft.id, input);
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
          // commitDraft(data.subscriptionDraftLineUpdate.draft.id);
          // this will be handled by the add
        }
      } catch (e) {
        console.log('Error', e.message);
        setToastError(true);
        setMsg('Error Updating Subscription');
        toggleActive();
      }
    },
  });
  // Add subscription draft line -> draft id
  const [addSubscriptionDraftLine] = useMutation(ADD_SUBSCRIPTION_DRAFT_LINE, {
    onCompleted: (data) => {
      try {
        if (data.subscriptionDraftLineAdd.userErrors.length > 0) {
          setLoading(false);
          setToastError(true);
          setMsg(data.subscriptionDraftLineAdd.userErrors[0].message);
          toggleActive();
        } else {
          setToastError(false);
          commitDraft(data.subscriptionDraftLineAdd.draft.id);
        }
      } catch (e) {
        console.log('Error', e.message);
        setToastError(true);
        setMsg('Error Adding Line Item To Subscription');
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
    [input],
  );

  const addDraftLine = useMemo(
    () => (draftId: string, input: any) => {
      try {
        addSubscriptionDraftLine({
          variables: {
            draftId: draftId,
            input: input,
          },
        });
      } catch (e) {
        console.log('Add Draft Line Error', e.message);
      }
    },
    [input],
  );

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
  const handleClick = () => {
    console.log('CLICKED ADD');
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
  };

  return (
    <Button primary loading={loading} onClick={handleClick}>
      Add
    </Button>
  );
};

export default AddLineToSubscriptionButton;
