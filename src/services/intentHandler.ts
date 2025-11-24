// File: src/services/intentHandler.ts

import { getSummaryStats } from "../intent-handlers/read/getSummaryStats";
import { listTransactions } from "../intent-handlers/read/listTransactions";
import { getTopCategory } from "../intent-handlers/read/getTopSpendingIncomeCategory";
import { ExtractedData } from "./geminiExtractor";
import { listRecurring } from "../intent-handlers/read/listRecurring";
import { getTopTransaction } from "../intent-handlers/read/getTopTransactions";
import { getTrendStats } from "../intent-handlers/read/getTrendStats";
import { getCategoryStats } from "../intent-handlers/read/getCategoryStats";
import { checkBudgetStatus } from "../intent-handlers/read/checkBudgetStatus";
import { listOverspentBudgets } from "../intent-handlers/read/listOverspentBudgets";
import { listSavingGoals } from "../intent-handlers/read/listSavingGoals";
import { checkGoalProgress } from "../intent-handlers/read/checkGoalProgress";
import { getAverageSpending } from "../intent-handlers/read/getAverageSpending";
import { getDailyAllowance } from "../intent-handlers/read/getDailyAllowance";
import { getAverageTransactionValue } from "../intent-handlers/read/getAverageTransactionValue";
import { getPeriodComparison } from "../intent-handlers/read/getPeriodComparison";
import { getSpendingForecast } from "../intent-handlers/read/getSpendingForecast";
import { addTransaction } from "../intent-handlers/write/addTransaction";
import { addBudget } from "../intent-handlers/write/addBudget";
import { addGoal } from "../intent-handlers/write/addGoal";

// Import các file xử lý cụ thể
// import { getTotalExpense } from '../intent-handlers/read/getTotalExpense';

// Định nghĩa kiểu trả về chung
export interface HandlerResult {
  reply: string;
  [key: string]: any; // Có thể chứa thêm data nếu client cần
}

// "Bản đồ" (Map) các intent
const intentMap: {
  [key: string]: (data: ExtractedData) => Promise<HandlerResult>;
} = {
  // Read Intents
  total_expense: getSummaryStats, 
  total_income: getSummaryStats, 
  compare_income_vs_expense: getSummaryStats,
  list_transactions: listTransactions,
  list_recurring: listRecurring,
  top_spending_category: getTopCategory,
  top_income_category: getTopCategory,
  highest_expense: getTopTransaction,
  lowest_expense: getTopTransaction,
  highest_income: getTopTransaction,
  lowest_income: getTopTransaction,
  spending_trend: getTrendStats,
  income_trend: getTrendStats,
  spending_by_category: getCategoryStats,
  income_by_category: getCategoryStats,
  check_budget_status: checkBudgetStatus,
  check_category_budget: checkBudgetStatus,
  list_overspent_budgets: listOverspentBudgets,
  list_saving_goals: listSavingGoals,
  check_goal_progress: checkGoalProgress,
  average_spending: getAverageSpending,
  daily_allowance_by_income: getDailyAllowance,
  average_transaction_value: getAverageTransactionValue,
  compare_period_over_period: getPeriodComparison,
  forecast_spending: getSpendingForecast,
  /* 
  check_budget_status: Lấy tóm tắt chung về tất cả các ngân sách (ví dụ: đã dùng 80%, còn lại 2.000.000đ). x
  check_category_budget: Lấy chi tiết của một ngân sách danh mục cụ thể. x
  list_overspent_budgets: Liệt kê các danh mục đã chi tiêu vượt quá ngân sách đã đặt. x 

  list_saving_goals: Liệt kê tất cả các mục tiêu và tiến độ chung. x
  check_goal_progress: Lấy chi tiết một mục tiêu cụ thể. x
  
  average_spending x
  average_transaction_value: Lấy total_expense / số lượng giao dịch. x

  So Sánh & Dự Đoán Nâng Cao
  compare_period_over_period: Lấy 2 khoảng thời gian và so sánh % tăng/giảm. x
  forecast_spending: Dựa trên chi tiêu trung bình, dự đoán tổng chi tiêu. 
  check_unusual_spending: Tìm các giao dịch lớn bất thường so với mức trung bình của danh mục đó.
  */

  // Write Intents
  add_transaction: addTransaction,
  add_budget: addBudget,
  add_goal: addGoal,
};

// Hàm "điều phối" (Router)
export const handleIntent = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const handler = intentMap[data.intent];

  if (handler) {
    return await handler(data);
  }

  // Xử lý intent 'unknown'
  console.warn(`No handler found for intent: ${data.intent}`);
  return {
    reply: "Xin lỗi, tôi chưa hiểu ý của bạn hoặc tôi chưa được lập trình để làm điều đó.",
  };
};