// File: src/services/geminiExtractor.ts
import { askGemini } from "./geminiService";

// Cấu trúc chuẩn mà AI sẽ trả về
export interface ExtractedData {
  intent: string;
  timeRange: { startDate: string; endDate: string } | null;
  category_keyword?: string; 
  type?: "income" | "expense";
  currency?: string;
  category?: string; // AI trả về thẳng "food", không phải "cà phê"
  amount?: number;   // AI trả về thẳng 50000, không phải 50
  description?: string;
  // specificDate?: string | null; 
  transactionDate?: string | null;
  compareTimeRange?: { startDate: string; endDate: string } | null;
  comparisonType?: "income" | "expense";
  goal_name?: string;
  token?: string; 
  userId?: string; 
}

const SYSTEM_CATEGORIES = [
  "food", "transportation", "education", "entertainment", "shopping",
  "housing", "health", "travel", "rent", "bonus", "salary", 
  "investment", "saving", "other", "sales",
].join(", ");

const DEFAULT_START_DATE = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
const DEFAULT_END_DATE = new Date().toISOString().split("T")[0];
const TODAY = new Date().toISOString().split("T")[0];

// Danh sách các intent read (timeRange)
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
// Danh sách các intent write (specificDate)
const WRITE_INTENTS = ["add_transaction", "add_budget", "add_goal"];


export const getExtractedDataFromGemini = async (
  question: string,
  prevContext: any
): Promise<Omit<ExtractedData, "token" | "userId">> => {
  const prompt = `
  Bạn là một hệ thống NLU cho chatbot tài chính.
  Nhiệm vụ của bạn là trích xuất TOÀN BỘ thông tin từ câu hỏi của người dùng
  và trả về MỘT JSON duy nhất.

  Thời gian hiện tại: ${new Date().toISOString()}

  Danh sách intent hợp lệ: [
    ${READ_INTENTS.map(i => `"${i}"`).join(", ")},
    ${WRITE_INTENTS.map(i => `"${i}"`).join(", ")},
    "unknown"
  ]

  Các thực thể (Entities) cần trích xuất:
  1.  "intent": (string) Bắt buộc.
  2.  "timeRange": (object) { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }.
  3. "category": (string) Bắt buộc. Phân tích từ khóa của người dùng và ÁNH XẠ về một trong các category hệ thống ở trên. 
     - Ví dụ: "cà phê", "ăn sáng" -> "food". 
     - "đổ xăng", "grab" -> "transportation". 
     - "đi xem phim" -> "entertainment".
     - Nếu người dùng nói "đặt tổng ngân sách", "ngân sách tháng này", trả về "TOTAL".
      - Nếu là danh mục cụ thể, trả về key hệ thống ("food", "transportation"...).
     - Nếu không tìm thấy map phù hợp, trả về "other".
  4. "type": (string) "income" hoặc "expense". Tự suy luận dựa trên category.
     - Ví dụ: category là "salary", "bonus" -> "income".
     - Còn lại đa số là "expense".
  5. "amount": (number) Số tiền thực tế. 
     - Tự động xử lý đơn vị: "50k", "50 nghìn" -> 50000. "1 triệu", "1 củ" -> 1000000. 
     - Giữ nguyên nếu là ngoại tệ: "50 usd" -> 50.
  5. "currency": (string) Mã tiền tệ chuẩn ISO (VND, USD, EUR...). 
     - Mặc định là "VND" nếu người dùng không nói rõ (hoặc dùng "k", "nghìn").
     - Nếu người dùng nói "đô", "usd" -> "USD".
  7.  "description": (string) Mô tả giao dịch (lấy nguyên văn phần nội dung từ người dùng).
  8.  "transactionDate": (string) "YYYY-MM-DD" 
  9.  "goal_name": (string) Tên của mục tiêu tiết kiệm (ví dụ: "laptop", "du lịch Nhật Bản").
  10. "compareTimeRange": (object) { "startDate": "...", "endDate": "..." } (Kỳ so sánh)
  11. "comparisonType": (string) "income" hoặc "expense".
---
### QUY TẮC LOGIC (Rất quan trọng)

Bạn PHẢI dựa vào "intent" để quyết định điền thực thể ngày tháng nào:

**1. Nếu intent là "GHI" (ví dụ: add_transaction, add_budget):**
   - **Ưu tiên** điền vào "transactionDate".
   - Nếu người dùng không nói ngày (ví dụ: "thêm 50k cà phê"), hãy MẶC ĐỊNH "transactionDate" là ngày hôm nay: "${TODAY}".
   - Nếu người dùng nói (ví dụ: "hôm qua", "ngày 5/11"), hãy điền ngày đó.
   - TRONG TRƯỜNG HỢP NÀY, "timeRange" phải là "null".
   - Nếu người dùng đề cập đến 1 ngày cụ thể (ví dụ 21/8), ưu tiên định dạng ngày tháng là DD/MM/YYYY, nếu không có tháng hoặc năm, mặc định là tháng hoặc năm hiện tại

**2. Nếu intent là "ĐỌC" (ví dụ: list_transactions, total_expense):**
   - **Ưu tiên** điền vào "timeRange".
   - Nếu người dùng không nói (ví dụ: "tổng chi?"), hãy kiểm tra ngữ cảnh.
   - Nếu không có ngữ cảnh, hãy MẶC ĐỊNH "timeRange" là tháng này:
     { "startDate": "${DEFAULT_START_DATE}", "endDate": "${DEFAULT_END_DATE}" }
   - TRONG TRƯỜNG HỢP NÀY, "transactionDate" phải là "null".
  
  **3. Nếu intent là "compare_period_over_period":**
   - **Ưu tiên** trích xuất "timeRange" (kỳ hiện tại) VÀ "compareTimeRange" (kỳ so sánh).
   - Ví dụ: "So sánh chi tiêu **tháng này** (timeRange) với **tháng trước** (compareTimeRange)".
   - Nếu người dùng chỉ nói "So với tháng trước", hãy MẶC ĐỊNH "timeRange" là "tháng này".
   - **Bắt buộc** trích xuất "comparisonType" (là "income" hay "expense"). Nếu không rõ, MẶC ĐỊNH là "expense".

---
    
  QUY TẮC XỬ LÝ NGỮ CẢNH:
  ${ prevContext ? `Ngữ cảnh trước đó: { "intent": "${prevContext.intent}", "timeRange": ${JSON.stringify(prevContext.timeRange)} }` : "Không có ngữ cảnh trước đó." }

  Chỉ sử dụng ngữ cảnh cho các intent "ĐỌC".
  
  * NẾU người dùng cung cấp thông tin MỚI (ví dụ: "còn tháng trước?"), hãy dùng thông tin MỚI.
  * NẾU người dùng KHÔNG cung cấp thông tin, hãy *sử dụng lại* thông tin từ ngữ cảnh.
  * NẾU không có thông tin mới VÀ không có ngữ cảnh, hãy dùng giá trị MẶC ĐỊNH cho timeRange là tháng này:
    { "startDate": "${DEFAULT_START_DATE}", "endDate": "${DEFAULT_END_DATE}" }
    
  CÂU HỎI: "${question}"
  TRẢ VỀ JSON (Chỉ JSON, không có giải thích):
  `;

  const rawResult = await askGemini(prompt);
  const parsedData = JSON.parse(rawResult.replace(/```json|```/g, "").trim());

  
  // fallback về date mặc định nếu không có ngày tháng
  if (READ_INTENTS.includes(parsedData.intent) && !parsedData.timeRange) {
    parsedData.timeRange = {
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    };
  }

  // 2. Đảm bảo các trường được trả về đúng như quy tắc phòng AI trả sai
  if (READ_INTENTS.includes(parsedData.intent)) {
    parsedData.transactionDate = null; 
  } else if (WRITE_INTENTS.includes(parsedData.intent)) {
    parsedData.timeRange = null; 
  }
  
  return parsedData;
};