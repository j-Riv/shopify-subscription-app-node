import React from 'react';
import {
  Card,
  Frame,
  Loading,
  SkeletonBodyText,
  SkeletonPage,
  SkeletonTabs,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';

interface Props {
  title: string;
}

function LoadingContracts({ title = 'Subscription' }: Props) {
  return (
    <SkeletonPage title={title}>
      <Frame>
        <Loading />
        <TitleBar title={title} />
        <Card sectioned>
          <SkeletonBodyText />
        </Card>
        <Card title={title} sectioned>
          <SkeletonTabs />
          <SkeletonBodyText />
        </Card>
      </Frame>
    </SkeletonPage>
  );
}

export default LoadingContracts;
