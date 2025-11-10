/**
 * (Helper) Định dạng tiền tệ cho mục tiêu,
 * xử lý các đơn vị (USD, EUR) và làm tròn số thập phân.
 */
export const formatGoalCurrency = (amount: number, currency: string): string => {
  // Làm tròn 2 chữ số thập phân (cho các số như 19.00999...)
  const roundedAmount = Math.round(amount * 100) / 100;
  
  // Quyết định locale để format (dấu chấm/phẩy)
  const locale = (currency === "USD" || currency === "EUR") ? "de-DE" : "vi-VN";
  
  return `${roundedAmount.toLocaleString(locale)} ${currency}`;
};