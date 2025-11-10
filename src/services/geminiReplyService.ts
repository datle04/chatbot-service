// File: src/services/replyService.ts

import { askGemini } from "./geminiService";
import { ExtractedData } from "./geminiExtractor";
import { getCategoryDisplayName } from "../types/categoryMapper";
import { formatGoalCurrency } from "../helper/formatGoalCurrency";

// --- CÁC HÀM TIỆN ÍCH (Private) ---

/**
 * (Helper) Định dạng khoảng thời gian
 */
const _formatDateRange = (timeRange: ExtractedData["timeRange"]): string => {
  if (!timeRange) return "trong khoảng thời gian không xác định";
  
  const { startDate, endDate } = timeRange;
  if (startDate === endDate) {
    return `trong ngày ${startDate}`;
  }
  return `từ ${startDate} đến ${endDate}`;
};

// --- CÁC HÀM FORMATTER (ĐƠN GIẢN - Trả về string) ---

/**
 * (Formatter đơn giản) Trả lời cho total_expense
 */
const _formatTotalExpense = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  const total = data?.totalExpense || 0;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);

  if (total === 0) {
    return `🎉 Thật tuyệt! Bạn không có khoản chi nào ${dateText}.`;
  }
  return `💸 Tổng chi tiêu của bạn ${dateText} là *${total.toLocaleString("vi-VN")} ${currency}*.`;
};

/**
 * (Formatter đơn giản) Trả lời cho total_expense
 */
const _formatTotalIncome = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  const total = data?.totalExpense || 0;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);

  if (total === 0) {
    return `Bạn không có khoản thu nào ${dateText}.`;
  }
  return `💸 Tổng thu nhập của bạn ${dateText} là *${total.toLocaleString("vi-VN")} ${currency}*.`;
};

/**
 * (Formatter đơn giản) Trả lời cho list_transactions
 */
const _formatListTransactions = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  const transactions = data?.data || [];
  const total = data?.total || transactions.length;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);

  if (transactions.length === 0) {
    return `✅ Không có giao dịch nào được ghi nhận ${dateText}.`;
  }

  const formatted = transactions
    .slice(0, 5) // Chỉ lấy 5 giao dịch
    .map((tx: any, i: number) => {
      const date = new Date(tx.date).toLocaleDateString("vi-VN");
      const amount = tx.amount.toLocaleString("vi-VN");
      const emoji = tx.type === "income" ? "💰" : "💸";
      return `${i + 1}. ${emoji} ${tx.category}: ${tx.note || '(không ghi chú)'} - **${amount} ${currency}** - ${date}`;
    })
    .join("\n");

  const reply = `📋 Đây là ${Math.min(total, 5)} trong số **${total} giao dịch** của bạn ${dateText}:
${formatted}
${total > 5 ? `\n...và ${total - 5} giao dịch khác.` : ""}`;

  return reply.trim();
};

/**
 * (Formatter đơn giản) Trả lời cho list_recurring
 */
const _formatListRecurring = (data: any, timeRange: ExtractedData["timeRange"] | null): string => {
  // 1. Sửa tên biến: Đọc từ 'transactions' (đã được làm phẳng ở handler)
  const transactions = data?.transactions || [];
  const total = data?.total || 0;

  // 2. Sửa lỗi: timeRange không liên quan đến intent này, xóa 'dateText'
  if (transactions.length === 0) {
    return `✅ Bạn hiện không có giao dịch định kỳ nào đang hoạt động.`;
  }

  const formatted = transactions
    .map((tx: any, i: number) => {
      // 3. Sửa lỗi: Dùng 'recurringDay' thay vì 'date'
      const day = `Hàng tháng vào ngày ${tx.recurringDay}`;
      
      // 4. Sửa lỗi: Đọc 'currency' động, không hardcode 'VND'
      const amount = tx.amount.toLocaleString("vi-VN");
      const currency = tx.currency || "VND"; // Lấy currency từ tx, fallback về VND
      
      const emoji = tx.type === "income" ? "💰" : "💸";
      
      return `${i + 1}. ${emoji} ${tx.category}: ${tx.note || '(không ghi chú)'} - **${amount} ${currency}** - (${day})`;
    })
    .join("\n");

  // 5. Sửa reply: Xóa 'dateText'
  const reply = `📋 Bạn có tổng cộng **${total} giao dịch định kỳ** đang hoạt động:
${formatted}`;

  return reply.trim();
};

const _formatTopCategory = (data: any, timeRange: ExtractedData['timeRange']): string => {
  const top = data?.top;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);
  
  if (!top) {
    return `✅ Không có dữ liệu danh mục nào ${dateText}.`;
  }

  const typeText = data.type === 'expense' ? 'chi tiêu' : 'thu nhập';
  const emoji = data.type === 'expense' ? '💸' : '💰';

  return `${emoji} Danh mục ${typeText} lớn nhất của bạn ${dateText} là **${top.category}**, với tổng số tiền **${top.displayAmount.toLocaleString("vi-VN")} ${currency}**.`;
}

/**
 * (Formatter đơn giản) Trả lời cho giao dịch cao nhất/thấp nhất
 */
const _formatTopTransaction = (
  intent: string,
  data: any, // Giả sử 'data' là object chứa 1 giao dịch
  timeRange: ExtractedData["timeRange"]
): string => {
  // API có thể trả về { transaction: {...} } hoặc chỉ {...}
  const tx = data?.data[0] || data; 
  const dateText = _formatDateRange(timeRange);

  if (!tx || !tx._id) { // Kiểm tra nếu không có giao dịch nào
    return `✅ Không tìm thấy giao dịch nào ${dateText}.`;
  }

  // 1. Suy luận từ 'intent'
  let noun: string; // "khoản chi" / "khoản thu"
  let verb: string; // "lớn nhất" / "nhỏ nhất"
  const emoji = intent.includes("income") ? "💰" : "💸";

  if (intent.includes("expense")) {
    noun = "khoản chi";
    verb = intent.includes("highest") ? "lớn nhất" : "nhỏ nhất";
  } else {
    noun = "khoản thu";
    verb = intent.includes("highest") ? "lớn nhất" : "nhỏ nhất";
  }
  
  // 2. Format dữ liệu
  const amount = tx.amount.toLocaleString("vi-VN");
  const currency = tx.currency || "VND";
  const date = new Date(tx.date).toLocaleDateString("vi-VN");

  // 3. Tạo câu trả lời
  return `${emoji} ${noun.charAt(0).toUpperCase() + noun.slice(1)} ${verb} của bạn ${dateText} là:
- **${amount} ${currency}** cho [${tx.category}] (${tx.note || 'không ghi chú'}) vào ngày ${date}.`;
};

const _formatCategoryStats = (
  intent: string,
  data: any,
  timeRange: ExtractedData["timeRange"]
): string => {
  const stats = data?.stats || [];
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);
  const categoryFilter = data?.categoryFilter; // Lấy 'category' mà user lọc

  // 1. Case: Không có dữ liệu
  if (stats.length === 0) {
    let msg = `✅ Không có dữ liệu ${data.type === 'expense' ? 'chi tiêu' : 'thu nhập'} nào ${dateText}`;
    if (categoryFilter) msg += ` cho danh mục "${categoryFilter}"`;
    return msg + ".";
  }

  // 2. Case: Lọc theo 1 category (VD: "chi tiêu Ăn uống")
  if (intent === "spending_by_category" && categoryFilter) {
    const total = stats.reduce((acc: number, curr: any) => acc + curr.displayAmount, 0);
    return `💸 Tổng chi tiêu của bạn cho **${categoryFilter}** ${dateText} là **${total.toLocaleString("vi-VN")} ${currency}**.`;
  }

  // 3. Case: Báo cáo top 1 (VD: "chi tiêu nhiều nhất")
  if (intent === "top_spending_category" || intent === "top_income_category") {
    // Sắp xếp (dù backend đã làm, nhưng để chắc chắn)
    const top = [...stats].sort((a, b) => b.displayAmount - a.displayAmount)[0];
    const typeText = data.type === 'expense' ? 'chi tiêu' : 'thu nhập';
    const emoji = data.type === 'expense' ? '💸' : '💰';
    return `${emoji} Danh mục ${typeText} lớn nhất của bạn ${dateText} là **${top.category}**, với tổng số tiền **${top.displayAmount.toLocaleString("vi-VN")} ${currency}**.`;
  }
  
  // 4. Case: Liệt kê tất cả (VD: "thống kê chi tiêu theo danh mục")
  if (intent === "spending_by_category" && !categoryFilter) {
    const list = stats
      .slice(0, 5) // Chỉ hiển thị 5 cái đầu
      .map((item: any) => `- **${item.category}**: ${item.displayAmount.toLocaleString("vi-VN")} ${currency}`)
      .join("\n");
      
    let reply = `📊 Đây là chi tiêu của bạn ${dateText}, phân loại theo danh mục:
${list}`;
    if (stats.length > 5) reply += `\n... và ${stats.length - 5} danh mục khác.`;
    return reply;
  }

  // Fallback
  return "Tôi đã có dữ liệu danh mục nhưng chưa biết cách diễn đạt.";
};

/**
 * (Formatter) Xử lý CẢ HAI intent 'check_budget_status' VÀ 'check_category_budget'
 * @param intent - Intent đang được xử lý
 * @param data - Dữ liệu từ API (đã bao gồm _filterCategory nếu có)
 * @param timeRange - Khoảng thời gian
 */
const _formatBudgetReply = (
  intent: string,
  data: any,
  timeRange: ExtractedData["timeRange"]
): string => {
  const dateText = _formatDateRange(timeRange);
  const displayCurrency = "VND"; // Tiền tệ quy đổi mặc định (bạn có thể lấy từ data)

  // --- BẮT ĐẦU LOGIC MỚI ---
  // 1. XỬ LÝ INTENT: "check_category_budget"
  if (intent === "check_category_budget") {
    const categoryKey = data._filterCategory; 

    // Lấy tên hiển thị từ key
    const displayName = getCategoryDisplayName(categoryKey);

    // 1a. AI không bắt được danh mục
    if (!categoryKey) {
      return "Bạn muốn tôi kiểm tra ngân sách cho danh mục nào vậy? (ví dụ: 'ăn uống')";
    }

    const categoryStats = data.categoryStats || [];
    const categoryData = categoryStats.find(
      (c: any) => c.category === categoryKey
    );

    // 1b. Không có ngân sách cho danh mục này
    if (!categoryData) {
      return `Bạn chưa thiết lập ngân sách cho danh mục **${displayName}** ${dateText}.`;
    }

    // 1c. Lấy tiền tệ gốc (ví dụ: "EUR") từ data gốc
    const originalCurrency = data.originalCurrency;
    const isMultiCurrency =
      originalCurrency && originalCurrency !== displayCurrency;

    // 1d. Tạo reply (ưu tiên tiền tệ gốc)
    if (isMultiCurrency) {
      // Dùng tiền tệ gốc (ví dụ: EUR)
      const budgetF = categoryData.originalBudgetedAmount.toLocaleString("de-DE");
      // Tính toán lại spent và remaining theo tiền tệ gốc
      const spentOriginal =
        (categoryData.originalBudgetedAmount * categoryData.percentUsed) / 100;
      const remainingOriginal =
        categoryData.originalBudgetedAmount - spentOriginal;
      const spentF = spentOriginal.toLocaleString("de-DE");
      const remainingF = Math.abs(remainingOriginal).toLocaleString("de-DE");

      if (remainingOriginal >= 0) {
        return `📊 Ngân sách cho **${displayName}** ${dateText}:
- **Đã đặt:** ${budgetF} ${originalCurrency}
- **Đã chi:** ${spentF} ${originalCurrency} (chiếm ${categoryData.percentUsed.toFixed(1)}%)
- **Còn lại:** ${remainingF} ${originalCurrency}`;
      } else {
        return `😟 Ngân sách cho **${displayName}** ${dateText} đã VƯỢT:
- **Đã đặt:** ${budgetF} ${originalCurrency}
- **Đã chi:** ${spentF} ${originalCurrency} (chiếm ${categoryData.percentUsed.toFixed(1)}%)
- **Đã vượt:** ${remainingF} ${originalCurrency}`;
      }
    } else {
      // Dùng tiền tệ đã quy đổi (ví dụ: VND)
      const budgetF = categoryData.budgetedAmount.toLocaleString("vi-VN");
      const spentF = categoryData.spentAmount.toLocaleString("vi-VN");
      const remaining = categoryData.budgetedAmount - categoryData.spentAmount;
      const remainingF = Math.abs(remaining).toLocaleString("vi-VN");

      if (remaining >= 0) {
        return `📊 Ngân sách cho **${displayName}** ${dateText}:
- **Đã đặt:** ${budgetF} ${displayCurrency}
- **Đã chi:** ${spentF} ${displayCurrency} (chiếm ${categoryData.percentUsed.toFixed(1)}%)
- **Còn lại:** ${remainingF} ${displayCurrency}`;
      } else {
         return `😟 Ngân sách cho **${displayName}** ${dateText} đã VƯỢT:
- **Đã đặt:** ${budgetF} ${originalCurrency}
- **Đã chi:** ${spentF} ${originalCurrency} (chiếm ${categoryData.percentUsed.toFixed(1)}%)
- **Đã vượt:** ${remainingF} ${originalCurrency}`;
      }
    }
  }
  // --- KẾT THÚC LOGIC MỚI ---

  // --- LOGIC CŨ CỦA BẠN (Dùng cho 'check_budget_status') ---
  const {
    originalAmount,
    originalCurrency,
    totalBudget,
    totalSpent,
    totalPercentUsed,
  } = data;

  // Kiểm tra nếu chưa set ngân sách
  if (!totalBudget || totalBudget === 0) {
    return `Bạn chưa thiết lập ngân sách nào ${dateText}.`;
  }

  const isMultiCurrency = originalCurrency && originalCurrency !== displayCurrency;

  if (isMultiCurrency) {
    // --- TRƯỜNG HỢP 1: XỬ LÝ ĐA TIỀN TỆ (Ví dụ: EUR) ---
    const spentOriginal = (originalAmount * totalPercentUsed) / 100;
    const remainingOriginal = originalAmount - spentOriginal;
    const totalF = originalAmount.toLocaleString("de-DE");     // "1.000"
    const spentF = spentOriginal.toLocaleString("de-DE");      // "251"
    const remainingF = remainingOriginal.toLocaleString("de-DE");  // "749"
    const spentConvertedF = totalSpent.toLocaleString("vi-VN"); // "7.683.357"

    if (remainingOriginal >= 0) {
      return `📊 Tình hình ngân sách của bạn ${dateText} đang rất tốt!
    - **Tổng ngân sách:** ${totalF} ${originalCurrency}
    - **Đã chi tiêu:** ${spentF} ${originalCurrency} (chiếm ${totalPercentUsed}%)
    - **Còn lại:** ${remainingF} ${originalCurrency}
    *(Chi tiêu quy đổi: ~${spentConvertedF} ${displayCurrency})*`;
    } else {
      // (Tương tự cho trường hợp vượt ngân sách)
      return `😟 **Cảnh báo ngân sách!** ${dateText}, bạn đã chi tiêu vượt ngân sách:
    - **Tổng ngân sách:** ${totalF} ${originalCurrency}
    - **Đã chi tiêu:** ${spentF} ${originalCurrency} (chiếm ${totalPercentUsed}%)
    - **Đã vượt:** ${Math.abs(remainingOriginal).toLocaleString("de-DE")} ${originalCurrency}
    *(Chi tiêu quy đổi: ~${spentConvertedF} ${displayCurrency})*`;
    }
  } else {
    // --- TRƯỜNG HỢP 2: XỬ LÝ TIỀN TỆ ĐƠN (Ví dụ: VND) ---
    const remainingAmount = totalBudget - totalSpent;
    const totalF = totalBudget.toLocaleString("vi-VN");
    const spentF = totalSpent.toLocaleString("vi-VN");
    const remainingF = Math.abs(remainingAmount).toLocaleString("vi-VN");

    if (remainingAmount >= 0) {
      return `📊 Tình hình ngân sách của bạn ${dateText} đang rất tốt!
    - **Tổng ngân sách:** ${totalF} ${displayCurrency}
    - **Đã chi tiêu:** ${spentF} ${displayCurrency} (chiếm ${totalPercentUsed}%)
    - **Còn lại:** ${remainingF} ${displayCurrency}`;
    } else {
      return `😟 **Cảnh báo ngân sách!** ${dateText}, bạn đã chi tiêu vượt ngân sách:
    - **Tổng ngân sách:** ${totalF} ${displayCurrency}
    - **Đã chi tiêu:** ${spentF} ${displayCurrency} (chiếm ${totalPercentUsed}%)
    - **Đã vượt:** ${remainingF} ${displayCurrency}`;
    }
  }
};

/**
 * (Formatter đơn giản) Trả lời cho list_overspent_budgets
 */
const _formatOverspentBudgets = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  const list = data?.overspentList || [];
  const total = data?.total || 0;
  const dateText = _formatDateRange(timeRange);

  // 1. Trường hợp không vượt
  if (total === 0) {
    return `🎉 Chúc mừng! Bạn không vượt chi ngân sách ở mục nào ${dateText}.`;
  }

  // 2. Trường hợp có vượt
  const formattedStrings = list.map((item: any, i: number) => {
    // Dữ liệu đã được handler tính toán sẵn
    const overF = item.overAmount.toLocaleString("vi-VN");
    return `${i + 1}. **${item.categoryName}**: Vượt **${overF} ${item.currency}**`;
  }).join("\n");

  return `😟 Bạn đã vượt ngân sách ở **${total}** danh mục ${dateText}:
${formattedStrings}`;
};

/**
 * (Formatter đơn giản) Trả lời cho list_saving_goals
 */
const _formatListSavingGoals = (data: any[]): string => { // data là mảng goals
  const goals = data || [];
  const total = goals.length;

  if (total === 0) {
    return `Bạn chưa đặt mục tiêu tiết kiệm nào. Hãy bắt đầu ngay!`;
  }

  const formattedStrings = goals.map((goal: any, i: number) => {
    // 1. Lấy thông tin từ mảng (chú ý đa tiền tệ)
    const name = goal.name;
    const currency = goal.targetCurrency; // "VND" hoặc "USD"
    
    // 2. Dùng helper để format (vì có đa tiền tệ và số lẻ)
    const currentF = formatGoalCurrency(goal.displayCurrentAmount, currency);
    const targetF = formatGoalCurrency(goal.targetOriginalAmount, currency);
    
    const progress = goal.progressPercent.toFixed(1); // Làm tròn 1 chữ số

    return `${i + 1}. **${name}**
   - Đã đạt: **${currentF}** / ${targetF}
   - Tiến độ: **${progress}%**`;
  }).join("\n\n"); // Xuống 2 dòng để tách biệt các mục tiêu

  return `🏁 Bạn đang có **${total} mục tiêu** tiết kiệm:
${formattedStrings}`;
};

/**
 * (Formatter đơn giản) Trả lời cho check_goal_progress
 */
const _formatGoalProgress = (data: any): string => {
  const goal = data?.goal;
  const query = data?.query; // Tên mà user hỏi (ví dụ: "laptop")

  // 1. Case: Không tìm thấy mục tiêu
  if (!goal) {
    return `Xin lỗi, tôi không tìm thấy mục tiêu tiết kiệm nào có tên giống như "${query}".`;
  }

  // 2. Case: Tìm thấy, format chi tiết
  const name = goal.name;
  const currency = goal.targetCurrency; // "VND" hoặc "USD"
  
  const currentF = formatGoalCurrency(goal.displayCurrentAmount, currency);
  const targetF = formatGoalCurrency(goal.targetOriginalAmount, currency);
  const remainingF = formatGoalCurrency(goal.displayRemainingAmount, currency);
  const progress = goal.progressPercent.toFixed(1);
  
  // Lấy thông tin kế hoạch
  const daysRemaining = goal.savingsPlan.daysRemaining;
  const recommendMonthly = formatGoalCurrency(goal.savingsPlan.recommendedMonthly, currency);

  let reply = `🏁 Đây là tiến độ cho mục tiêu **${name}**:
- **Đã đạt:** **${currentF}** / ${targetF}
- **Tiến độ:** **${progress}%**
- **Còn thiếu:** ${remainingF}`;

  // 3. Thêm lời khuyên
  if (!goal.isCompleted && daysRemaining > 0) {
    reply += `\n\n💡 *Lời khuyên: Để đạt mục tiêu trong ${daysRemaining} ngày tới, bạn nên tiết kiệm khoảng **${recommendMonthly}** mỗi tháng.*`;
  } else if (goal.isCompleted) {
    reply += `\n\n🎉 *Chúc mừng! Bạn đã hoàn thành mục tiêu này!*`;
  } else {
    reply += `\n\n🗓️ *Mục tiêu này đã quá hạn nhưng chưa hoàn thành.*`;
  }

  return reply;
};

// --- CÁC HÀM GENERATOR (PHỨC TẠP - Gọi AI) ---

/**
 * (Generator phức tạp) Phân tích xu hướng
 */
const _generateTrendReply = async (intent: string, data: any): Promise<string> => {
  const dataString = JSON.stringify(data);
  const trendType = intent === "spending_trend" ? "chi tiêu" : "thu nhập";

  const instruction = `
    **Nhiệm vụ: Phân tích xu hướng ${trendType} như một chuyên gia tài chính.**
    Dữ liệu cung cấp là một mảng { period, total, currency }.
    1.  Phân tích toàn bộ mảng dữ liệu để xác định xu hướng chung (tăng 📈, giảm 📉, hay không ổn định 📊).
    2.  Tính tổng ${trendType} của toàn bộ giai đoạn.
    3.  Đưa ra một nhận xét ngắn gọn, thông minh và thân thiện.
  `;

  const prompt = `Bạn là một trợ lý tài chính ảo thân thiện tên là FinAI.
    Dựa vào dữ liệu JSON sau, hãy tạo một câu trả lời tiếng Việt.
    Dữ liệu:
    \`\`\`json
    ${dataString}
    \`\`\`
    Chỉ dẫn: ${instruction}
  `;
  return await askGemini(prompt);
};

/**
 * (Formatter đơn giản) Trả lời cho average_spending
 */
const _formatAverageSpending = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  // Dữ liệu đã được handler tính toán sẵn
  const average = data?.average || 0;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);

  if (average === 0) {
    return `✅ Bạn không có chi tiêu nào ${dateText}.`;
  }
  
  const averageF = average.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

  return `📊 Trung bình ${dateText}, bạn đã chi tiêu **${averageF} ${currency}** mỗi ngày.`;
};

const _formatDailyAllowance = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  const allowance = data?.allowance || 0;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);

  if (allowance === 0) {
    return `Bạn không có thu nhập nào ${dateText}, nên tôi không thể tính hạn mức chi tiêu.`;
  }

  const allowanceF = allowance.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

  return `💰 Dựa trên tổng thu nhập ${dateText}, bạn có thể chi tiêu tối đa **${allowanceF} ${currency}** mỗi ngày.`;
};

const _formatAverageTransactionValue = (data: any, timeRange: ExtractedData["timeRange"]): string => {
  const average = data?.average || 0;
  const count = data?.transactionCount || 0;
  const currency = data?.currency || "VND";
  const dateText = _formatDateRange(timeRange);

  if (count === 0) {
    return `✅ Bạn không có giao dịch nào ${dateText}.`;
  }
  
  const averageF = average.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

  return `Trung bình ${dateText}, mỗi giao dịch của bạn có giá trị là **${averageF} ${currency}** (dựa trên ${count} giao dịch).`;
};

/**
 * (Generator phức tạp) Tóm tắt tiết kiệm
 */
const _generateSavingSummary = async (data: any, timeRange: ExtractedData["timeRange"]): Promise<string> => {
  const dataString = JSON.stringify(data, null, 2);
  const dateText = _formatDateRange(timeRange);

  const instruction = `Viết một bản tóm tắt tình hình tiết kiệm ${dateText} dựa trên dữ liệu.
    - Dữ liệu có (totalIncome, totalExpense, balance, currency).
    - Nếu số dư (balance) > 0, hãy chúc mừng họ.
    - Nếu ngược lại, hãy đưa ra lời khuyên nhẹ nhàng.
    - Đảm bảo dùng đúng số tiền và đơn vị tiền tệ (${data.currency}) từ dữ liệu.
  `;
  
  const prompt = `Bạn là một trợ lý tài chính ảo thân thiện tên là FinAI.
    Dựa vào dữ liệu JSON sau đây, hãy tạo một câu trả lời ngắn gọn bằng tiếng Việt.
    Giọng văn: Vui vẻ, khích lệ, rõ ràng. 

    Dữ liệu:
    \`\`\`json
    ${dataString}
    \`\`\`
    Chỉ dẫn: ${instruction}
  `;
  return await askGemini(prompt);
};

/**
 * (Generator phức tạp) Phân tích so sánh kỳ-với-kỳ
 */
const _generateComparisonReply = async (data: any): Promise<string> => {
  const dataString = JSON.stringify(data, null, 2);
  const typeText = data.type === 'expense' ? 'chi tiêu' : 'thu nhập';

  const instruction = `
    **Nhiệm vụ: So sánh ${typeText} giữa hai kỳ như một chuyên gia tài chính.**
    Dữ liệu (data) chứa:
    - "current": { "value", "startDate", "endDate" } (kỳ hiện tại)
    - "previous": { "value", "startDate", "endDate" } (kỳ trước)
    - "comparison": { "difference", "percentChange" }
    - "currency": (Đơn vị tiền tệ)
    
    Hãy viết một câu trả lời thân thiện, bao gồm:
    1.  Thông báo ${typeText} kỳ hiện tại.
    2.  Thông báo ${typeText} kỳ trước.
    3.  Đưa ra kết luận (tăng hay giảm bao nhiêu % và bao nhiêu tiền).
    4.  Đưa ra một lời khuyên ngắn gọn (ví dụ: "rất tốt!" nếu chi tiêu giảm, "hãy cẩn thận!" nếu chi tiêu tăng).
  `;

  const prompt = `Bạn là một trợ lý tài chính ảo thân thiện tên là FinAI.
    Dựa vào dữ liệu JSON sau, hãy tạo một câu trả lời tiếng Việt.
    Dữ liệu:
    \`\`\`json
    ${dataString}
    \`\`\`
    Chỉ dẫn: ${instruction}
  `;
  return await askGemini(prompt);
};

/**
 * (Generator phức tạp) Phân tích dự đoán chi tiêu
 */
const _generateForecastReply = async (data: any): Promise<string> => {
  const dataString = JSON.stringify(data, null, 2);

  const instruction = `
    **Nhiệm vụ: Phân tích và dự đoán chi tiêu tháng này.**
    Dữ liệu (data) chứa:
    - "currentSpent": (Số tiền đã chi đến hiện tại)
    - "dailyAverage": (Chi tiêu trung bình mỗi ngày)
    - "forecastedTotal": (Tổng chi tiêu dự đoán cho cả tháng)
    - "totalBudget": (Ngân sách đã đặt cho tháng này, có thể là 0)
    - "currency": (Đơn vị tiền tệ)
    - "daysRemaining": (Số ngày còn lại)
    
    Hãy viết một câu trả lời thân thiện, bao gồm:
    1.  Thông báo số tiền đã chi (currentSpent).
    2.  Thông báo mức chi trung bình (dailyAverage).
    3.  Đưa ra con số dự đoán (forecastedTotal) cho đến cuối tháng.
    4.  (Rất quan trọng) So sánh 'forecastedTotal' với 'totalBudget':
        - Nếu 'totalBudget' = 0: Bỏ qua, không so sánh.
        - Nếu 'forecastedTotal' < 'totalBudget': Chúc mừng (ví dụ: "Bạn đang đi đúng hướng!").
        - Nếu 'forecastedTotal' > 'totalBudget': Cảnh báo (ví dụ: "Hãy cẩn thận! Bạn có nguy cơ vượt ngân sách!").
  `;

  const prompt = `Bạn là một trợ lý tài chính ảo thân thiện tên là FinAI.
    Dựa vào dữ liệu JSON sau, hãy tạo một câu trả lời tiếng Việt.
    Dữ liệu:
    \`\`\`json
    ${dataString}
    \`\`\`
    Chỉ dẫn: ${instruction}
  `;
  return await askGemini(prompt);
};


// --- HÀM CHÍNH (PUBLIC) ---

/**
 * 🚀 Bộ máy tạo câu trả lời (Reply Engine)
 * Quyết định dùng template nhanh hay dùng AI thông minh
 * * @param intent - Intent được trích xuất
 * @param apiData - Dữ liệu thô trả về từ FinTrack API
 * @param timeRange - Khoảng thời gian (hoặc null)
 * @returns Một chuỗi (string) câu trả lời đã được định dạng
 */
export const generateReply = async (
  intent: string,
  apiData: any,
  timeRange: ExtractedData["timeRange"]
): Promise<string> => {

  // 1. Kiểm tra dữ liệu rỗng (trước khi làm bất cứ điều gì)
  if (!apiData) {
     return `✅ Tôi không tìm thấy dữ liệu nào ${timeRange ? _formatDateRange(timeRange) : ""}.`;
  }

  // 2. Bộ điều phối (Router)
  switch (intent) {
    // --- Các case ĐƠN GIẢN (Dùng Formatter) ---
    case "total_expense":
      return _formatTotalExpense(apiData, timeRange);

    case "total_income":
      return _formatTotalIncome(apiData, timeRange);

    case "list_transactions":
      return _formatListTransactions(apiData, timeRange);

    case "list_recurring":
      return _formatListRecurring(apiData, timeRange);
      
    case "top_spending_category":
      return _formatTopCategory(apiData, timeRange);

    case "top_income_category":
      return _formatTopCategory(apiData, timeRange);

    case "highest_expense":
    case "lowest_expense":
    case "highest_income":
    case "lowest_income":
      // Truyền cả 'intent' vào formatter
      return _formatTopTransaction(intent, apiData, timeRange);
    
    case "spending_by_category":
    case "income_by_category":
      return _formatCategoryStats(intent, apiData, timeRange);
    
    case "check_budget_status":
    case "check_category_budget":
      return _formatBudgetReply(intent, apiData, timeRange);
    case "list_overspent_budgets":
      return _formatOverspentBudgets(apiData, timeRange);

    case "list_saving_goals":
      return _formatListSavingGoals(apiData);
    case "check_goal_progress":
      return _formatGoalProgress(apiData);

    case "average_spending":
      return _formatAverageSpending(apiData, timeRange);
    case "daily_allowance_by_income":
      return _formatDailyAllowance(apiData, timeRange);
    case "average_transaction_value":
      return _formatAverageTransactionValue(apiData, timeRange);
    // (Thêm các case đơn giản khác vào đây)
    
    // case "highest_expense":

    // --- Các case PHỨC TẠP (Dùng AI Generator) ---
    case "saving_summary":
    case "compare_income_vs_expense":
      return await _generateSavingSummary(apiData, timeRange);

    case "spending_trend":
    case "income_trend":
      return await _generateTrendReply(intent, apiData);
    
    case "compare_period_over_period":
      return await _generateComparisonReply(apiData); 
      
    case "forecast_spending":
      return await _generateForecastReply(apiData);
    // (Thêm các case phức tạp khác vào đây)
    // case "average_spending_base_on_income":

    // --- Mặc định ---
    default:
      console.warn(`[replyService] Không tìm thấy formatter/generator cho intent: ${intent}`);
      return "Tôi đã có dữ liệu nhưng chưa biết cách diễn đạt. Bạn có thể hỏi lại được không?";
  }
};