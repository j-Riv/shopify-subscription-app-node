import React from 'react';
import {
  Card,
  Frame,
  Layout,
  Loading,
  PageActions,
  SkeletonBodyText,
  SkeletonPage,
  SkeletonThumbnail,
} from '@shopify/polaris';
import styled from 'styled-components';

const Product = styled.div`
  display: grid;
  grid-template-columns: 50px auto;
  gap: 2em;
  align-items: center;
`;

const LoadingSellingPlan = () => {
  return (
    <SkeletonPage breadcrumbs={true} title="Seling Plan Group">
      <Frame>
        <Loading />
        <Layout>
          <Layout.Section>
            <Card title="Information" sectioned>
              <SkeletonBodyText lines={3} />
            </Card>
            <Card title="Products" sectioned>
              <SkeletonBodyText lines={1} />
              {Array.from(new Array(3)).map((_, i) => {
                return (
                  <Product key={i}>
                    <SkeletonThumbnail size="small" />
                    <SkeletonBodyText lines={1} />
                  </Product>
                );
              })}
            </Card>
          </Layout.Section>
          <Layout.AnnotatedSection title="Edit" description="Edit Selling Plan">
            <Card sectioned>
              <Layout>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
              </Layout>
            </Card>
            <Card sectioned>
              <Layout>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
              </Layout>
            </Card>
            <Card sectioned>
              <Layout>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
              </Layout>
            </Card>
            <Card sectioned>
              <Layout>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
                <Layout.Section>
                  <SkeletonBodyText lines={3} />
                  <SkeletonBodyText lines={3} />
                </Layout.Section>
              </Layout>
            </Card>
          </Layout.AnnotatedSection>
        </Layout>
        <PageActions
          primaryAction={{
            content: 'Update',
          }}
          secondaryActions={{
            content: 'Cancel',
          }}
        />
      </Frame>
    </SkeletonPage>
  );
};

export default LoadingSellingPlan;
