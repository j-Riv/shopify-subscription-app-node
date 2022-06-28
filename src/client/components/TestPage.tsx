import React from 'react';
import { Card, Page, Layout, TextContainer, Stack, Heading } from '@shopify/polaris';
import { Link as RouterLink } from 'react-router-dom';

const TestPage = () => (
  <Page fullWidth>
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <Stack wrap={false} spacing="extraTight" distribution="trailing" alignment="center">
            <Stack.Item fill>
              <TextContainer spacing="loose">
                <Heading>Test Page on Shopify app 🎉</Heading>
                <p>
                  <RouterLink to="/">Go Home</RouterLink>
                </p>
              </TextContainer>
            </Stack.Item>
          </Stack>
        </Card>
      </Layout.Section>
    </Layout>
  </Page>
);

export default TestPage;
