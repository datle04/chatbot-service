"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeSeriesData = exports.getTopTransactions = exports.listRecurring = exports.getTopSpendingIncomeCategory = exports.listTransactions = exports.fetchDashboardSummary = exports.getCategoryStats = void 0;
// src/services/fintrackClient.ts
const axios_1 = __importDefault(require("axios"));
const FINTRACK_API = process.env.FINTRACK_API_URL;
// ---- REFACTORED FUNCTIONS ----
/**
 * Lấy thống kê theo danh mục cho income hoặc expense.
 * Gộp từ 2 hàm getTotalExpense và getTotalIncome.
 */
const getCategoryStats = async (token, start, end, type) => {
    const res = await axios_1.default.get(`${FINTRACK_API}/stats/category-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type, startDate: start, endDate: end },
    });
    const total = res.data.reduce((acc, curr) => acc + curr.total, 0);
    return {
        total,
        details: res.data // Dữ liệu chi tiết từng danh mục
    };
};
exports.getCategoryStats = getCategoryStats;
/**
 * Lấy dữ liệu tổng quan thu/chi/cân đối.
 * Gộp từ compareIncomeExpense và fetchDashboardSummary.
 */
const fetchDashboardSummary = async (token, startDate, endDate) => {
    const url = `${FINTRACK_API}/dashboard?startDate=${startDate}&endDate=${endDate}`;
    const response = await axios_1.default.get(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
exports.fetchDashboardSummary = fetchDashboardSummary;
// ---- EXISTING FUNCTIONS (vẫn giữ nguyên) ----
const listTransactions = async (token, start, end, type, category, limit = 50) => {
    const res = await axios_1.default.get(`${FINTRACK_API}/transaction`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: start, endDate: end, type, category, limit },
    });
    return res.data;
};
exports.listTransactions = listTransactions;
const getTopSpendingIncomeCategory = async (token, start, end, type) => {
    const res = await axios_1.default.get(`${FINTRACK_API}/stats/category-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type, startDate: start, endDate: end }
    });
    const topCategory = [...res.data].sort((a, b) => b.total - a.total)[0];
    return {
        top: topCategory,
        data: res.data,
    };
};
exports.getTopSpendingIncomeCategory = getTopSpendingIncomeCategory;
const listRecurring = async (token) => {
    const res = await axios_1.default.get(`${FINTRACK_API}/transaction/recurring`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data;
};
exports.listRecurring = listRecurring;
const getTopTransactions = async (token, start, end, type, order) => {
    const res = await axios_1.default.get(`${FINTRACK_API}/transaction/top-transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: start, endDate: end, type, order }
    });
    return res.data;
};
exports.getTopTransactions = getTopTransactions;
// /**
//  * Tính toán khoảng thời gian của kỳ liền trước.
//  * @param startDate 'YYYY-MM-DD'
//  * @param endDate 'YYYY-MM-DD'
//  * @returns { startDate: string, endDate: string } của kỳ trước.
//  */
// const getPreviousPeriod = (startDate: string, endDate: string) => {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const duration = end.getTime() - start.getTime(); // Khoảng thời gian của kỳ hiện tại (tính bằng ms)
//   // Ngày kết thúc của kỳ trước là 1 ngày trước ngày bắt đầu của kỳ hiện tại
//   const prevEndDate = new Date(start.getTime() - 24 * 60 * 60 * 1000);
//   // Ngày bắt đầu của kỳ trước
//   const prevStartDate = new Date(prevEndDate.getTime() - duration);
//   return {
//     startDate: prevStartDate.toISOString().split('T')[0],
//     endDate: prevEndDate.toISOString().split('T')[0],
//   };
// };
// // ---- HÀM MỚI ĐỂ LẤY DỮ LIỆU TREND ----
// /**
//  * Lấy dữ liệu tổng thu/chi của kỳ hiện tại và kỳ trước để so sánh.
//  * @param token User token
//  * @param start Ngày bắt đầu kỳ hiện tại
//  * @param end Ngày kết thúc kỳ hiện tại
//  * @param type 'income' hoặc 'expense'
//  */
// export const getTrendData = async (token: string | undefined, start: string, end: string, type: 'income' | 'expense') => {
//   const previousPeriod = getPreviousPeriod(start, end);
//   // Gọi API song song để tăng hiệu suất
//   const [currentResult, previousResult] = await Promise.all([
//     getCategoryStats(token, start, end, type),
//     getCategoryStats(token, previousPeriod.startDate, previousPeriod.endDate, type)
//   ]);
//   return {
//     currentPeriod: {
//       total: currentResult.total,
//       startDate: start,
//       endDate: end,
//     },
//     previousPeriod: {
//       total: previousResult.total,
//       startDate: previousPeriod.startDate,
//       endDate: previousPeriod.endDate,
//     }
//   };
// };
/**
 * Lấy dữ liệu chuỗi thời gian (time series) theo từng tháng.
 * @param token User token
 * @param startDate Ngày bắt đầu của khoảng thời gian lớn
 * @param endDate Ngày kết thúc của khoảng thời gian lớn
 * @param type 'income' hoặc 'expense'
 * @returns Mảng dữ liệu tổng hợp theo từng tháng.
 */
const getTimeSeriesData = async (token, startDate, endDate, type) => {
    const series = [];
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
        const promise = (0, exports.getCategoryStats)(token, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0], type).then(result => ({
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
exports.getTimeSeriesData = getTimeSeriesData;
