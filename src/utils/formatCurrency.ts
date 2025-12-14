/**
 * Hàm định dạng tiền tệ chuyên nghiệp.
 * Sử dụng Intl.NumberFormat chuẩn của JavaScript.
 * * @param amount - Số tiền (number)
 * @param currency - Đơn vị tiền tệ (string), mặc định là "VND"
 * @returns Chuỗi đã format (VD: "50.000 VND", "100 USD")
 */
export const formatCurrency = (amount: number, currency: string = "VND"): string => {
  // 1. Fallback an toàn: Nếu amount không phải số (null/undefined), trả về 0
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0 ${currency}`;
  }

  // 2. Cấu hình format
  // Locale 'vi-VN' sẽ tự động dùng dấu chấm (.) để phân cách hàng nghìn
  // và dấu phẩy (,) để phân cách thập phân.
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0, 
    // Nếu là VND thì không cần số lẻ thập phân, ngoại tệ khác thì lấy tối đa 2 số lẻ
    maximumFractionDigits: currency.toUpperCase() === "VND" ? 0 : 2, 
  };

  // 3. Format số
  const formattedNumber = new Intl.NumberFormat("vi-VN", options).format(amount);

  // 4. Trả về kết quả kèm đơn vị tiền tệ
  return `${formattedNumber} ${currency.toUpperCase()}`;
};