// File: src/services/nluExtractor.ts
import { askAI } from "./aiProvider";

// --- CÁC INTERFACE VÀ CONSTANTS GIỮ NGUYÊN ---
export interface ExtractedData {
  intent: string;
  timeRange: { startDate: string; endDate: string } | null;
  category_keyword?: string; 
  type?: "income" | "expense";
  currency?: string;
  category?: string;
  amount?: number;
  description?: string;
  transactionDate?: string | null;
  compareTimeRange?: { startDate: string; endDate: string } | null;
  comparisonType?: "income" | "expense";
  goal_name?: string;
  token?: string; 
  userId?: string; 
  target_id?: "last" | string;
  recurring_keyword?: string;
  new_amount?: number;
  new_category?: string;
  _ai_source?: string;
}

const SYSTEM_CATEGORIES = [
  "food", "transportation", "education", "entertainment", "shopping",
  "housing", "health", "travel", "rent", "bonus", "salary", 
  "investment", "saving", "other", "sales",
].join(", ");

const DEFAULT_START_DATE = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
const DEFAULT_END_DATE = new Date().toISOString().split("T")[0];
const TODAY = new Date().toISOString().split("T")[0];

const READ_INTENTS = [
  "total_expense", "total_income", "list_transactions", "list_recurring",
  "spending_by_category", "income_by_category",
  "highest_expense", "highest_income", "lowest_expense", "lowest_income", 
  "top_spending_category", "compare_income_vs_expense", 
  "spending_trend", "income_trend",
  "check_budget_status", "check_category_budget", "list_overspent_budgets",
  "list_saving_goals", "check_goal_progress",
  "average_spending", "daily_allowance_by_income", "average_transaction_value",
  "compare_period_over_period", "forecast_spending"
];

const WRITE_INTENTS = ["add_transaction", "add_budget", "add_goal"];
const UPDATE_INTENTS = ["delete_last_transaction", "update_transaction", "cancel_recurring"];
const HELPER_INTENTS = ["financial_advice", "help"];

// --- HÀM CHÍNH ---
export const getExtractedDataFromAI = async (
  question: string,
  prevContext: any
): Promise<Omit<ExtractedData, "token" | "userId">> => {
  
  // Prompt giữ nguyên 100% vì nó đã rất tốt
  const prompt = `
  Bạn là một hệ thống NLU cho chatbot tài chính.
  Nhiệm vụ của bạn là trích xuất TOÀN BỘ thông tin từ câu hỏi của người dùng
  và trả về MỘT JSON duy nhất.

  Thời gian hiện tại: ${new Date().toISOString()}

  Danh sách intent hợp lệ: [
    ${READ_INTENTS.map(i => `"${i}"`).join(", ")},
    ${WRITE_INTENTS.map(i => `"${i}"`).join(", ")},
    ${UPDATE_INTENTS.map(i => `"${i}"`).join(", ")},
    ${HELPER_INTENTS.map(i => `"${i}"`).join(", ")},
    "unknown"
  ]

  Các thực thể (Entities) cần trích xuất:
  1. "intent": (string) Bắt buộc.
  2. "timeRange": (object) { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }.
  3. "category": (string) Ánh xạ về list: [${SYSTEM_CATEGORIES}]. "other" nếu không khớp. "TOTAL" nếu hỏi ngân sách tổng.
  4. "type": (string) "income" hoặc "expense". Tự suy luận dựa trên category.
  5. "amount": (number) Số tiền thực tế. 
  6. "currency": (string) Mã tiền tệ chuẩn ISO (VND, USD...). Mặc định "VND".
  7. "description": (string) Mô tả giao dịch.
  8. "transactionDate": (string) "YYYY-MM-DD"
  9. "goal_name": (string) Tên mục tiêu tiết kiệm.
  10. "compareTimeRange": (object) { "startDate": "...", "endDate": "..." }
  11. "comparisonType": (string) "income" hoặc "expense".

  ### QUY TẮC LOGIC (Rất quan trọng)
  Bạn PHẢI dựa vào "intent" để quyết định điền thực thể ngày tháng nào:
  1. Intent "GHI" (${WRITE_INTENTS}): Ưu tiên "transactionDate". Mặc định "${TODAY}". "timeRange" là null.
  2. Intent "ĐỌC" (${READ_INTENTS}): Ưu tiên "timeRange". Mặc định tháng này. "transactionDate" là null.
  3. Compare: Cần cả "timeRange" và "compareTimeRange".
  4. Sửa/Xóa: Tìm target_id, new_amount...

  ### QUY TẮC TRÁNH NHẦM LẪN INTENT:
  Bạn không được phép nhầm các intent xin lời khuyên như financial_advice sang các intent khác về ngân sách hay dashboard.
  Các mẹo để bạn có thể nhận biết intent là financial_advice:
  - Trong câu có cú pháp "Tình hình tài chính ...", "Giúp tôi ra lời khuyên...", "Dựa vào..., Hãy nhận xét ...".

  QUY TẮC XỬ LÝ NGỮ CẢNH:
  ${ prevContext ? `Ngữ cảnh trước đó: { "intent": "${prevContext.intent}", "timeRange": ${JSON.stringify(prevContext.timeRange)} }` : "Không có ngữ cảnh trước đó." }
  
  CÂU HỎI: "${question}"
  TRẢ VỀ JSON (Chỉ JSON, không có giải thích):
  `;

  // --- THAY ĐỔI QUAN TRỌNG TẠI ĐÂY ---
  // Truyền thêm tham số `true` để bật chế độ JSON Mode
  // Điều này báo cho groqService set temperature = 0.1 và System Prompt bắt buộc JSON
  const { text: rawResult, source } = await askAI(prompt, true); 
  
  console.log(`🤖 Response from [${source}]:`, rawResult);

  try {
    // 1. Clean JSON (Dọn dẹp các ký tự markdown thừa nếu AI lỡ thêm vào)
    let cleanJson = rawResult.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanJson = jsonMatch[0];

    // 2. Parse
    const parsedData = JSON.parse(cleanJson);

    // 3. Post-processing Logic (Xử lý hậu kỳ để đảm bảo logic nghiệp vụ)
    if (READ_INTENTS.includes(parsedData.intent) && !parsedData.timeRange) {
      parsedData.timeRange = { startDate: DEFAULT_START_DATE, endDate: DEFAULT_END_DATE };
    }
    if (READ_INTENTS.includes(parsedData.intent)) parsedData.transactionDate = null;
    else if (WRITE_INTENTS.includes(parsedData.intent)) parsedData.timeRange = null;

    // Gắn source vào để debug (giúp bạn biết request này được xử lý bởi ai)
    parsedData._ai_source = source;

    return parsedData;
  } catch (error) {
    console.error(`❌ JSON Parse Error (${source}):`, rawResult);
    // Trả về object an toàn để app không crash
    return { 
        intent: "unknown", 
        timeRange: null, 
        transactionDate: null, 
        _ai_source: source 
    };
  }
};