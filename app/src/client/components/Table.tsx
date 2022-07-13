import React from 'react';
import { ColumnContentType, DataTable } from '@shopify/polaris';

interface Props {
  contentTypes: ColumnContentType[];
  headings: string[];
  rows: any[][];
}

const Table = ({ contentTypes, headings, rows }: Props) => {
  return <DataTable columnContentTypes={contentTypes} headings={headings} rows={rows} />;
};

export default Table;
