function calculateOrderProfit(order) {
  const saleTotal = order.sale_price; // already total (price * qty)
  const platformFee = order.platform_fee || 0;
  const shippingFee = order.shipping_fee || 0;
  const otherDeductions = order.other_deductions || 0;
  const costPrice = order.my_cost_price || 0;
  const netReceived = saleTotal - platformFee - shippingFee - otherDeductions;
  const profit = netReceived - costPrice;
  const marginPercent = saleTotal > 0 ? ((profit / saleTotal) * 100).toFixed(2) : 0;
  return { platformFee, netReceived: parseFloat(netReceived.toFixed(2)), profit: parseFloat(profit.toFixed(2)), marginPercent: parseFloat(marginPercent) };
}

module.exports = { calculateOrderProfit };
