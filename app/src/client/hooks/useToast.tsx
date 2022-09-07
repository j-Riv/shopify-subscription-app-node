import React, { useState, useCallback } from 'react';
import { Toast } from '@shopify/polaris';

export function useToast() {
  const [active, setActive] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const setMsg = useCallback((msg) => setToastMsg(msg), []);
  const setToastError = useCallback((error) => setIsError(error), []);

  const toastMarkup = active ? (
    <Toast content={toastMsg} onDismiss={toggleActive} error={isError} />
  ) : null;

  return {
    active,
    toastMsg,
    isError,
    toggleActive,
    setMsg,
    setToastError,
    toastMarkup,
  };
}
