const DiscountPrice = (price: number, rate: number) => price * (1 - rate / 100);
export default DiscountPrice;
