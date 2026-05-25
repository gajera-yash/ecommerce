export function formatCurrency(amount, symbol = '₹') {
  const num = parseFloat(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function calcProfit(order) {
  const sale = parseFloat(order.sale_price) || 0;
  const pf = parseFloat(order.platform_fee) || 0;
  const sf = parseFloat(order.shipping_fee) || 0;
  const od = parseFloat(order.other_deductions) || 0;
  const cost = parseFloat(order.my_cost_price) || 0;
  const net = sale - pf - sf - od;
  const profit = net - cost;
  const margin = sale > 0 ? ((profit / sale) * 100).toFixed(2) : 0;
  return { net, profit, margin };
}

export const deliveryStatusColors = {
  PENDING: 'orange',
  SHIPPED: 'blue',
  DELIVERED: 'green',
  CANCELLED: 'red',
  RETURNED: 'volcano',
};

export const paymentStatusColors = {
  PAID: 'green',
  PENDING: 'orange',
  REFUNDED: 'red',
};
