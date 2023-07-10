export enum IntervalOption {
  Daily = 'DAY',
  Weekly = 'WEEK',
  Monthly = 'MONTH',
  Yearly = 'YEAR',
}

export interface SellingPlan {
  id: number;
  intervalCount: string;
  intervalOption: string;
  percentageOff: string;
  position?: number;
}
