import { createFinTrackApiClient } from "../../services/fintrackClient";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { HandlerResult } from "../../services/intentHandler";

export const checkBudgetStatus = async (data: ExtractedData): Promise<HandlerResult> => {
    const { intent, token, timeRange, category } = data;
    
    if (!token) {
        return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
    }
    if (!timeRange) {
        return { reply: "Lỗi: Tôi không thể xác định khoảng thời gian cho ngân sách." };
    }
    // 1. Lấy startDate từ timeRange (ví dụ: "2025-11-01")
  const { startDate } = timeRange;

  // 2. Tạo đối tượng Date và trích xuất
  // Lưu ý: new Date() xử lý múi giờ. Nếu 'startDate' là "2025-11-01",
  // nó sẽ hiểu là 00:00:00 *theo giờ địa phương*.
  const dateObj = new Date(startDate);
  
  const year = dateObj.getFullYear();    // -> 2025
  const month = dateObj.getMonth() + 1;   // -> 11 (vì getMonth() trả về 0-11)

  // --- KẾT THÚC THAY ĐỔI ---

  try {
    const apiClient = createFinTrackApiClient(token);

    // 3. Gọi API backend của bạn với 'month' và 'year'
    // (Giả sử endpoint là /budget như bạn nói)
    const res = await apiClient.get(`/budget`, { // <-- Sửa endpoint (nếu cần)
      params: {
        year: year,
        month: month,
      },
    });

    // ... (Phần còn lại của hàm giữ nguyên)
    const apiData = {
     ...res.data,
     _filterCategory: category
    }
    if(apiData.message){
        return {
            reply: "Bạn chưa đặt ngân sách cho tháng 11, mau chóng đặt để cùng quản lý chi tiêu một cách hiệu quả nhé!"
        }
    }

    const replyString = await generateReply(intent, apiData, timeRange);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi check budget cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, hiện tôi không thể kiểm tra ngân sách cho bạn. Bạn có yêu cầu nào khác không?",
    };
  }
}