// src/services/intentHandler.ts
import * as fintrackClient from "./fintrackClient";
import { generateReply } from "./geminiReplyService";
import { calculateTotalDays } from "./timeParser";

interface IntentHandlerParams {
  intent: string;
  userToken?: string;
  userId: string;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  type?: string;
  category?: string;
  order?: string;
}

export const handleIntent = async ({ intent, userId, userToken, timeRange, type = "", category = "", order = "" }: IntentHandlerParams) => {
  const { startDate, endDate } = timeRange;
  let data: any;

  try {
    switch (intent) {
      case "total_expense": {
        const result = await fintrackClient.getCategoryStats(userToken, startDate, endDate, 'expense');
        data = { total: result.total }; // Chỉ truyền dữ liệu cần thiết
        break;
      }

      case "total_income": {
        const result = await fintrackClient.getCategoryStats(userToken, startDate, endDate, 'income');
        data = { total: result.total };
        break;
      }

      case "list_transactions": {
        data = await fintrackClient.listTransactions(userToken, startDate, endDate, type, category);
        break;
      }

      case "list_recurring": {
        data = await fintrackClient.listRecurring(userToken);
        break;
      }

      case "top_spending_category":
      case "top_income_category": {
        const transactionType = intent === "top_spending_category" ? 'expense' : 'income';
        data = await fintrackClient.getTopSpendingIncomeCategory(userToken, startDate, endDate, transactionType);
        break;
      }
      
      case "compare_income_vs_expense":
      case "saving_summary": {
        const summary = await fintrackClient.fetchDashboardSummary(userToken, startDate, endDate);
        const days = calculateTotalDays(startDate, endDate); // Thêm tính ngày
        // Thống nhất cấu trúc dữ liệu
        data = {
            summary: summary,
            days: days, // Gửi cả số ngày để Gemini có thêm ngữ cảnh
        };
        break;
      }

      case "highest_expense":
      case "lowest_expense":
      case "highest_income":
      case "lowest_income": {
        const transactionType = intent.includes('income') ? 'income' : 'expense';
        const sortOrder = intent.startsWith('highest') ? 'desc' : 'asc';
        data = await fintrackClient.getTopTransactions(userToken, startDate, endDate, transactionType, sortOrder);
        break;
      }

      case "average_spending_base_on_income":
      case "average_spending_base_on_expense": {
        const summary = await fintrackClient.fetchDashboardSummary(userToken, startDate, endDate);
        const days = calculateTotalDays(startDate, endDate);
        
        // Đóng gói tất cả dữ liệu cần thiết cho Gemini
        data = {
          summary: summary,
          days: days,
        };
        break;
      }

      case "spending_trend":
      case "income_trend": {
        const type = intent.includes('income') ? 'income' : 'expense';
        // Gọi hàm lấy dữ liệu chuỗi thời gian
        data = await fintrackClient.getTimeSeriesData(userToken, timeRange.startDate, timeRange.endDate, type);
        break;
      }

      default:
        return { reply: "🤔 Mình chưa hiểu ý bạn — bạn có thể nói rõ hơn không?", data: null };
    }

    // Sau khi có data, gọi service của Gemini để tạo reply
    const reply = await generateReply(intent, data, timeRange);
    
    return { reply, data };

  } catch (error) {
    console.error(`Error handling intent ${intent}:`, error);
    return { reply: "😔 Rất tiếc, đã có lỗi xảy ra khi mình xử lý yêu cầu của bạn.", data: null };
  }
};