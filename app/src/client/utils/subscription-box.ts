export const calculateCurrentPrice = (discountRate: number, currentPrice: string) => {
  const price = parseFloat(currentPrice);
  const amount = (price - price * discountRate).toFixed(2);
  return String(amount);
};

export const calculateDiscountRate = (
  totalQuantity: number,
  isSubscriptionBox: boolean = false,
) => {
  let discountRate = 0;
  if (isSubscriptionBox) {
    if (totalQuantity >= 5) {
      discountRate = 0.2;
    } else if (totalQuantity >= 4) {
      discountRate = 0.15;
    } else if (totalQuantity >= 3) {
      discountRate = 0.1;
    } else {
      discountRate = 0;
    }
  }
  return discountRate;
};
