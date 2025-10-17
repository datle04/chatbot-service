// src/services/responseFormatter.ts

// Helper nhỏ để định dạng ngày tháng cho nhất quán
const formatDateRange = (startDate: string, endDate: string): string => {
  if (startDate === endDate) {
    return `trong ngày ${startDate}`;
  }
  return `từ ${startDate} đến ${endDate}`;
};

export const formatTotalExpense = (data: any, timeRange: { startDate: string; endDate: string }) => {
  const total = data?.totalExpense || 0;
  const dateText = formatDateRange(timeRange.startDate, timeRange.endDate);
  if (total === 0) {
    return { reply: `🎉 Thật tuyệt! Bạn không có khoản chi nào ${dateText}.` };
  }
  return {
    reply: `💸 Tổng chi tiêu của bạn ${dateText} là **${total.toLocaleString('vi-VN')}đ**.`,
    data,
  };
};

export const formatListTransactions = (result: any, timeRange: { startDate: string; endDate: string }) => {
  const { data, total } = result;
  const dateText = formatDateRange(timeRange.startDate, timeRange.endDate);

  if (!data || data.length === 0) {
    return { reply: `✅ Không có giao dịch nào được ghi nhận ${dateText}.` };
  }

  const formatted = data
    .slice(0, 5)
    .map((tx: any, i: number) => {
      const date = new Date(tx.date).toLocaleDateString("vi-VN");
      const amount = tx.amount.toLocaleString("vi-VN");
      const emoji = tx.type === "income" ? "💰" : "💸";
      return `${i + 1}. ${emoji} ${tx.category}: ${tx.note || '(không có ghi chú)'} - **${amount}đ** - ${date}`;
    })
    .join("\n");

  const reply = `
    📋 Đây là ${Math.min(total, 5)} trong số **${total} giao dịch** của bạn ${dateText}:
${formatted}
    ${total > 5 ? `\n...và ${total - 5} giao dịch khác.` : ""}
  `.trim();

  return { reply, data };
};

export const formatSavingSummary = (data: any, timeRange: { startDate: string; endDate: string }) => {
    const { income, expense, balance } = data;
    const dateText = formatDateRange(timeRange.startDate, timeRange.endDate);

    const incomeF = income.toLocaleString("vi-VN");
    const expenseF = expense.toLocaleString("vi-VN");
    const balanceAbsF = Math.abs(balance).toLocaleString("vi-VN");

    if (balance > 0) {
        return {
            reply: `🎉 **Làm tốt lắm!** ${dateText}, bạn đã quản lý tài chính rất hiệu quả:\n\n💰 Thu nhập: **${incomeF}đ**\n💸 Chi tiêu: **${expenseF}đ**\n\n✨ Bạn đã tiết kiệm được **${balanceAbsF}đ**! Hãy tiếp tục phát huy nhé.`,
            data,
        };
    } else {
        return {
            reply: `😟 **Cùng xem lại nhé!** ${dateText}, tình hình tài chính của bạn như sau:\n\n💰 Thu nhập: **${incomeF}đ**\n💸 Chi tiêu: **${expenseF}đ**\n\n⚠️ Bạn đã chi tiêu nhiều hơn thu nhập **${balanceAbsF}đ**. Hãy kiểm tra lại các khoản chi để cân đối lại nhé!`,
            data,
        };
    }
};

// ... Thêm các function format khác cho các intent còn lại
// Ví dụ: formatTopCategory, formatHighestTransaction,...