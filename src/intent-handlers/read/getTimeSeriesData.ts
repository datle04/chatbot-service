import { createFinTrackApiClient } from "../../services/fintrackClient";
import { getCategoryStats } from "./getCategoryStats";

/**
 * Lấy dữ liệu chuỗi thời gian (time series) theo từng tháng.
 * @param token User token
 * @param startDate Ngày bắt đầu của khoảng thời gian lớn
 * @param endDate Ngày kết thúc của khoảng thời gian lớn
 * @param type 'income' hoặc 'expense'
 * @returns Mảng dữ liệu tổng hợp theo từng tháng.
 */
export const getTimeSeriesData = async (token: string | undefined, startDate: string, endDate: string, type: 'income' | 'expense') => {
  if (!token) {
    throw new Error("Missing authentication token for getTimeSeriesData");
  }

  const apiClient = createFinTrackApiClient(token);

  const series: { period: string; total: number }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Tạo một mảng các promise để gọi API song song
  const promises = [];

  // Vòng lặp qua từng tháng trong khoảng thời gian
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    // Tạo promise để lấy dữ liệu cho tháng hiện tại
    const promise = getCategoryStats(
      token,
      monthStart.toISOString().split('T')[0],
      monthEnd.toISOString().split('T')[0],
      type
    ).then(result => ({
      period: `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`,
      total: result.total,
    }));
    
    promises.push(promise);
    
    // Chuyển sang tháng tiếp theo
    current.setMonth(current.getMonth() + 1);
  }

  // Chờ tất cả các promise hoàn thành
  const results = await Promise.all(promises);

  return results;
};