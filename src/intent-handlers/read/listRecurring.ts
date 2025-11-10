import { createFinTrackApiClient } from "../../services/fintrackClient";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { HandlerResult } from "../../services/intentHandler";

export const listRecurring = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  // 1. Lấy intent và token. timeRange không cần thiết cho intent này.
  const { intent, token } = data;

  if (!token) {
    // 2. Sửa lỗi: Không nên ném Error, nên trả về HandlerResult
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }

  const apiClient = createFinTrackApiClient(token);

  try {
    const res = await apiClient.get(`/transaction/recurring`);

    // 3. ⭐️ ĐÂY LÀ PHẦN SỬA CHÍNH ⭐️
    // res.data.data là một Object, không phải Array.
    // Chúng ta cần chuyển nó thành một mảng các giao dịch.
    const groupsObject = res.data.data || {};
    // Lấy giao dịch ĐẦU TIÊN từ mỗi nhóm
    const transactionsList = Object.values(groupsObject).map(
      (group: any) => group[0] // Lấy phần tử đầu tiên của mỗi mảng con
    );

    const total = res.data.totalGroups || 0;

    // 4. Đặt tên dữ liệu rõ ràng
    const apiData = {
      transactions: transactionsList, // Gửi mảng đã làm phẳng
      total: total,
    };

    // 5. Gọi generateReply (không cần timeRange)
    // AI sẽ tự biết intent là "list_recurring" và không cần ngày tháng
    const replyString = await generateReply(intent, apiData, null); // Truyền null cho timeRange

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy recurring transactions cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được danh sách giao dịch định kỳ.",
    };
  }
};