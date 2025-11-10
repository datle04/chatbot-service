// File: src/utils/dateUtils.ts (Hoặc nơi bạn lưu các hàm tiện ích)

/**
 * Tính tổng số ngày (bao gồm cả ngày bắt đầu và kết thúc)
 */
export const calculateTotalDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Ngày không hợp lệ để tính toán");
  }

  // Chuyển sang UTC để tránh lỗi múi giờ
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

  const diffMs = endUTC - startUTC;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays + 1; // +1 để bao gồm cả ngày bắt đầu
};