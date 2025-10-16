// src/services/intentHandler.ts
import { start } from "repl";
import { compareIncomeExpense, getTopSpendingIncomeCategory, getTopTransactions, getTotalExpense, getTotalIncome, listRecurring, listTransactions, getSpendingByCategory } from "./fintrackClient";

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

export const handleIntent = async ({ intent, userId, userToken, timeRange, type="", category="", order="" }: IntentHandlerParams) => {
  const { startDate, endDate } = timeRange;

  switch (intent) {
    case "total_expense": {
      const data = await getTotalExpense(userToken, startDate, endDate);
      const total = data?.totalExpense || 0;
      return { reply: `💸 Tổng chi từ ${startDate} đến ${endDate}: ${total.toLocaleString()}₫`, data };
    }

    case "total_income": {
      const data = await getTotalIncome(userToken, startDate, endDate);
      const total = data?.totalIncome || 0;
      return { reply: `💸 Tổng thu nhập từ ${startDate} đến ${endDate}: ${total.toLocaleString()}₫`, data };
    }

    case "list_transactions": {
      const result = await listTransactions(userToken, startDate, endDate, type, category);
      const { data, total } = result;

      if (!data || data.length === 0) {
        return { reply: `⚠️ Không có giao dịch nào từ ${startDate} đến ${endDate}.` };
      }

      // 🗓️ Format danh sách giao dịch
      const formatted = data
        .slice(0, 5) // chỉ hiển thị tối đa 5 giao dịch
        .map((tx: any, i: number) => {
          const date = new Date(tx.date).toLocaleDateString("vi-VN");
          const amount = tx.amount.toLocaleString("vi-VN");
          const emoji = tx.type === "income" ? "💰" : "💸";
          return `${i + 1}. ${emoji} ${tx.note || "(Không ghi chú)"} — ${tx.category} — ${amount}đ — ${date}`;
        })
        .join("\n");

      const reply = `
        📋 Có ${total} giao dịch từ ${startDate} đến ${endDate}.
        ${formatted}
        ${total > 5 ? `\n...và ${total - 5} giao dịch khác.` : ""}
      `.trim();

      return { reply, data };
    }

    case "top_spending_category": {
      const res = await getTopSpendingIncomeCategory(userToken, startDate, endDate, type = 'expense');
      return { reply: `💸 Từ ${startDate} đến ${endDate}, bạn chi nhiều nhất cho danh mục ${res.top.category} với số tiền là ${res.top.total.toLocaleString("vi-VN")}đ, ngoài ra bạn còn chi vào các danh mục sau:`, data: res.data};
    }

    case "top_income_category": {
      const res = await getTopSpendingIncomeCategory(userToken, startDate, endDate, type = 'income');
      return { reply: `💸 Từ ${startDate} đến ${endDate}, bạn thu nhiều nhất cho danh mục ${res.top.category} với số tiền là ${res.top.total.toLocaleString("vi-VN")}đ, ngoài ra bạn còn thu từ các danh mục sau:`, data: res.data};
    }

    case "compare_income_vs_expense":{
      const res = await compareIncomeExpense(userToken, startDate, endDate);
      return { reply: `💸 Từ ${startDate} đến ${endDate}, bạn thu được ${res.income.toLocaleString("vi-VN")}đ và chi ${res.expense.toLocaleString("vi-VN")}đ, chênh lệch ${Math.abs(res.balance).toLocaleString("vi-VN")}đ`}
    }

    case "list_recurring":{
      const res = await listRecurring(userToken, startDate, endDate);
      const data = Object.values(res).flat()
      return { reply: `💸 Các giao dịch định kỳ hiện đang hoạt động của bạn là: `, data};
    }

    case "highest_expense": {
      const res = await getTopTransactions(userToken, startDate, endDate, type='expense', order='desc');
      const data = res.data
      return { reply: `💸 Từ ${startDate} đến ${endDate}, giao dịch lớn nhất bạn đã chi là ${data[0].amount.toLocaleString("vi-VN")}đ`, data};
    }

    case "lowest_expense": {
      const res = await getTopTransactions(userToken, startDate, endDate, type='expense', order='asc');
      const data = res.data
      return { reply: `💸 Từ ${startDate} đến ${endDate}, giao dịch nhỏ nhất bạn đã chi là ${data[0].amount.toLocaleString("vi-VN")}đ`, data};
    }

    case "highest_income": {
      const res = await getTopTransactions(userToken, startDate, endDate, type='income', order='desc');
      const data = res.data
      return { reply: `💸 Từ ${startDate} đến ${endDate}, giao dịch lớn nhất bạn đã thu là ${data[0].amount.toLocaleString("vi-VN")}đ`, data};
    }

    case "lowest_income": {
      const res = await getTopTransactions(userToken, startDate, endDate, type='income', order='asc');
      const data = res.data
      return { reply: `💸 Từ ${startDate} đến ${endDate}, giao dịch nhỏ nhất bạn đã thu là ${data[0].amount.toLocaleString("vi-VN")}đ`, data};
    }

    case "spending_by_category":{
      const data = await getSpendingByCategory(userToken, startDate, endDate, type = 'expense');
      return { reply: `💸 Từ ${startDate} đến ${endDate}, bạn đã chi vào các giao dịch sau: `, data};
    }

    case "saving_summary": {
      const data = await compareIncomeExpense(userToken, startDate, endDate);

      const incomeFormatted = data.income.toLocaleString("vi-VN");
      const expenseFormatted = data.expense.toLocaleString("vi-VN");
      const balanceAbsFormatted = Math.abs(data.balance).toLocaleString("vi-VN"); 

      if(data.balance > 0){
        // Trường hợp tiết kiệm (balance > 0)
        return {
          reply: `🎉 **Tuyệt vời!** Từ ${startDate} đến ${endDate}, bạn đã có một kết quả đáng ngưỡng mộ:
          💰 Tổng thu: ${incomeFormatted}đ
          💸 Tổng chi: ${expenseFormatted}đ
          ✨ **Bạn đã tiết kiệm được ${balanceAbsFormatted}đ!**
          Hãy tiếp tục giữ vững phong độ chi tiêu hợp lý này nha!`,
          data
        };
      }
      // Trường hợp chi tiêu vượt thu nhập (balance <= 0)
      return {
        reply: `😟 **Cần chú ý một chút nhé!** Từ ${startDate} đến ${endDate}, tình hình tài chính của bạn đang như sau:
        💰 Tổng thu: ${incomeFormatted}đ
        💸 Tổng chi: ${expenseFormatted}đ
        ⚠️ **Hiện tại, bạn đang chi tiêu vượt thu nhập ${balanceAbsFormatted}đ.**
        Hãy cùng xem xét lại các khoản chi tiêu để đưa tài chính về trạng thái cân bằng sớm nhất bạn nha!`,
        data
      };
    }

    default:
      return { reply: "🤔 Mình chưa hiểu ý bạn — bạn có thể nói rõ hơn không?" };
  }
};
