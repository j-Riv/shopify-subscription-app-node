/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState } from 'react';
import { Button } from '@shopify/polaris';
import { useMutation } from '@apollo/client';
import {
  UPDATE_SUBSCRIPTION_CONTRACT,
  REMOVE_SUBSCRIPTION_DRAFT_LINE,
  COMMIT_SUBSCRIPTION_DRAFT,
} from '../handlers';

interface Props {
  contractId: string;
  lineId?: string;
  toggleActive: () => void;
  setMsg: (msg: string) => void;
  setToastError: (error: boolean) => void;
  refetch: () => void;
}

const RemoveLineFromSubscriptionButton = ({
  contractId,
  lineId,
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
        removeDraftLine(data.subscriptionContractUpdate.draft.id, lineId);
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
  const handleClick = (_lineId: string) => {
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
    <Button primary loading={loading} onClick={() => handleClick(lineId)}>
      Remove
    </Button>
  );
};

export default RemoveLineFromSubscriptionButton;
