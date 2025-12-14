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
  transactionDate?: string | null;
  compareTimeRange?: { startDate: string; endDate: string } | null;
  comparisonType?: "income" | "expense";
  goal_name?: string;
  token?: string; 
  userId?: string; 
  // New fields
  target_id?: "last" | string;
  recurring_keyword?: string;
  new_amount?: number;
  new_category?: string;
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

const UPDATE_INTENTS = ["delete_last_transaction", "update_transaction", "cancel_recurring"]

const HELPER_INTENTS = ["financial_advice", "help"]


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
    ${UPDATE_INTENTS.map(i => `"${i}"`).join(", ")},
    ${HELPER_INTENTS.map(i => `"${i}"`).join(", ")},
    "unknown"
  ]

  Các thực thể (Entities) cần trích xuất:
  1.  "intent": (string) Bắt buộc.
  2.  "timeRange": (object) { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }.
  3. "category": (string) Ánh xạ về list: [${SYSTEM_CATEGORIES}]. "other" nếu không khớp. "TOTAL" nếu hỏi ngân sách tổng.
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

  **4.Intent "SỬA/XÓA" (update_..., delete_...):**
   - "delete_last_transaction": set "target_id": "last".
   - "update_transaction": set "target_id": "last". Tìm "new_amount" hoặc "new_category".
   - "cancel_recurring": Tìm "recurring_keyword".
  
   **5.Intent "AI" (financial_advice):** Chỉ cần intent.
---

### PHÂN BIỆT INTENT QUAN TRỌNG (Rất quan trọng):

1. **"financial_advice" (Tư vấn/Đánh giá):**
   - Dùng khi câu hỏi mang tính **CHUNG CHUNG**, hỏi về **CHẤT LƯỢNG** hoặc **CẢM XÚC**.
   - Từ khóa nhận diện: "thế nào", "ra sao", "ổn không", "tốt không", "đánh giá", "tư vấn", "lời khuyên", "sức khỏe tài chính", "tình hình tài chính".
   - Ví dụ: "Tài chính tháng này thế nào?", "Tôi chi tiêu có hợp lý không?", "Có lời khuyên gì không?".

2. **"compare_income_vs_expense" (So sánh Thu/Chi):**
   - Dùng khi câu hỏi mang tính **SỐ HỌC**, tính toán cụ thể sự chênh lệch.
   - Từ khóa nhận diện: "so sánh", "cân đối", "dư bao nhiêu", "lợi nhuận", "âm hay dương".
   - Ví dụ: "So sánh thu và chi tháng này", "Tháng này tôi dư được bao nhiêu?", "Thu nhập có bù được chi tiêu không?".

3. **"check_budget_status" (Kiểm tra ngân sách):**
   - Dùng khi nhắc cụ thể đến từ "ngân sách" (budget) hoặc "hạn mức".
   - Ví dụ: "Ngân sách ăn uống còn bao nhiêu?", "Tôi lố ngân sách chưa?".
    
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

  console.log("⏳ Đang gửi prompt lên Gemini...");
  const rawResult = await askGemini(prompt);
  console.log("🤖 Gemini Raw Response:", rawResult);

  try {
    // BƯỚC 1: Làm sạch dữ liệu thô
    // Xóa markdown code block (```json ... ```)
    let cleanJson = rawResult.replace(/```json|```/g, "").trim();

    // BƯỚC 2: Trích xuất JSON bằng Regex (Phòng trường hợp Gemini nói nhảm ở đầu/cuối)
    // Tìm từ dấu { đầu tiên đến dấu } cuối cùng
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    // BƯỚC 3: Parse JSON
    const parsedData = JSON.parse(cleanJson);

    // --- LOGIC XỬ LÝ DỮ LIỆU SAU KHI PARSE THÀNH CÔNG ---

    // 1. Fallback về date mặc định nếu là intent ĐỌC mà thiếu ngày
    if (READ_INTENTS.includes(parsedData.intent) && !parsedData.timeRange) {
      parsedData.timeRange = {
        startDate: DEFAULT_START_DATE,
        endDate: DEFAULT_END_DATE,
      };
    }

    // 2. Đảm bảo clean các trường không cần thiết dựa trên intent
    if (READ_INTENTS.includes(parsedData.intent)) {
      parsedData.transactionDate = null; 
    } else if (WRITE_INTENTS.includes(parsedData.intent)) {
      parsedData.timeRange = null; 
    }

    return parsedData;
  } catch (error) {
    console.error("❌ Lỗi Parse JSON từ Gemini:", error);
    console.error("Văn bản gây lỗi:", rawResult);

    // BƯỚC 4: Trả về Object mặc định "An toàn" để App không crash
    return {
      intent: "unknown",
      timeRange: null,
      transactionDate: null
    };
  }
};