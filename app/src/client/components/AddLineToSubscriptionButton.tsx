/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState } from 'react';
import { Button } from '@shopify/polaris';
import { useMutation } from '@apollo/client';
import {
  UPDATE_SUBSCRIPTION_CONTRACT,
  ADD_SUBSCRIPTION_DRAFT_LINE,
  COMMIT_SUBSCRIPTION_DRAFT,
} from '../handlers';

interface Props {
  contractId: string;
  input: any;
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
      const productVariant = productVariants.find((el: any) => el.node.id === itemToAdd);

      input.currentPrice = productVariant.price;
      input.pricingPolicy = {
        basePrice: productVariant.price,
        cycleDiscounts: {
          adjustmentType: 'PERCENTAGE',
          adjustmentValue: {
            percentage: 10,
          },
          afterCycle: 0,
          computedPrice: productVariant.price,
        },
      };
      addDraftLine(data.subscriptionContractUpdate.draft.id, input);
    },
  });
  // Update subscription draft line -> draft id
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

  const addDraftLine = (draftId: string, lineId: string) => {
    try {
      addSubscriptionDraftLine({
        variables: {
          draftId: draftId,
          lineId: lineId,
        },
      });
    } catch (e) {
      console.log('Add Draft Line Error', e.message);
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
  const handleClick = () => {
    console.log('CLICKED ADD');
    // try {
    //   setLoading(true);
    //   updateSubscriptionContract({
    //     variables: {
    //       contractId: contractId,
    //     },
    //   });
    // } catch (e) {
    //   console.log('Update Contract Error', e.message);
    // }
  };

  return (
    <Button primary loading={loading} onClick={handleClick}>
      Add
    </Button>
  );
};

export default AddLineToSubscriptionButton;
