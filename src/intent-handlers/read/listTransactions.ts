// File: src/intent-handlers/read/listTransactions.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";

// Giả định cấu trúc của một giao dịch trả về từ API backend
interface Transaction {
  _id: string;
  date: string;
  category: string;
  note?: string;
  amount: number;
  currency: number;
  isRecurring: boolean;
  goalId: string;
}

interface Summary {
  income: number;
  expense: number;
  balance: number;
}

// Giả định API trả về cấu trúc này
interface ApiResponse {
  data: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  summary: Summary;
  timeRange: { startDate: Date; endDate: Date}
}

export const listTransactions = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  // 1. Destructure data từ object (thay vì dùng nhiều tham số)
  const { intent, token, timeRange, type, category } = data;
  const limit = 50; // Bạn có thể giữ nguyên hoặc để AI trích xuất

  if (!token) {
    // Không nên ném Error, mà trả về một reply lỗi
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 2. Xây dựng params một cách linh hoạt
    // (Để API backend có thể xử lý nếu type/category là undefined)
    const params: any = {
      startDate: timeRange?.startDate,
      endDate: timeRange?.endDate,
      limit,
    };
    if (type) params.type = type;
    if (category) params.category = category;

    // 3. Gọi API (chỉ định rõ kiểu trả về)
    const res = await apiClient.get<ApiResponse>(`/transaction`, { params });
    console.log(res.data);

    const transactions = res.data.data;

    // // 4. Xử lý trường hợp không có giao dịch
    // if (!transactions || transactions.length === 0) {
    //   // Xây dựng câu trả lời tùy thuộc vào có bộ lọc hay không
    //   let replyMsg = `Tôi không tìm thấy giao dịch nào từ ${timeRange?.startDate} đến ${timeRange?.endDate}`;
    //   if (category) replyMsg += ` trong danh mục "${category}"`;
    //   if (type) replyMsg += ` (loại: ${type})`;

    //   return {
    //     reply: `${replyMsg}.`,
    //   };
    // }

    // // 5. Soạn câu trả lời (đây là phần quan trọng của HandlerResult)
    // let reply = `Đây là ${transactions.length} giao dịch gần nhất của bạn:\n`;
    // transactions.forEach((tx) => {
    //   const txDate = new Date(tx.date).toLocaleDateString("vi-VN"); // Format ngày
    //   reply += `- (${txDate}) [${tx.category}] ${
    //     tx.note || "..."
    //   }: ${tx.amount.toLocaleString()} ${tx.currency}\n`;
    // });

    const replyString = await generateReply(intent, res.data, timeRange)
    // 6. Trả về đối tượng HandlerResult
    return {
      reply: replyString,
      data: transactions, // (Tùy chọn) Gửi kèm data thô nếu client cần
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách giao dịch:", error);
    return {
      reply: "Rất tiếc, tôi không thể lấy danh sách giao dịch của bạn lúc này.",
    };
  }
};