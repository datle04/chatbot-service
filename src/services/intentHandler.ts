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
import { deleteLastTransaction } from "../intent-handlers/update/deleteLastTransaction";
import { cancelRecurringTransaction } from "../intent-handlers/update/cancelRecurringTransaction";
import { getFinancialAdvice } from "../intent-handlers/advice/getFinancialAdvice";

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

  // Write Intents
  add_transaction: addTransaction,
  add_budget: addBudget,
  add_goal: addGoal,

  // Update Intents
  delete_last_transaction: deleteLastTransaction,
  cancel_recurring: cancelRecurringTransaction,

  // Advice Intents
  financial_advice: getFinancialAdvice,
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