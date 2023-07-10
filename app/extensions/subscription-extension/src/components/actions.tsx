import React from 'react';
import { Button, BlockStack } from '@shopify/admin-ui-extensions-react';

function Actions({ onPrimary, onClose, title }) {
  return (
    <BlockStack spacing="none" inlineAlignment="center">
      <Button title="Cancel" onPress={onClose} />
      <BlockStack inlineAlignment="center" spacing="loose">
        <Button title={title} onPress={onPrimary} />
      </BlockStack>
    </BlockStack>
  );
}

export default Actions;
