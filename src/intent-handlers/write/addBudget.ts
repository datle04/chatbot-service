// File: src/intent-handlers/write/addBudget.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { normalizeCategory, getCategoryDisplayName } from "../../types/categoryMapper";
import { generateReply } from "../../services/geminiReplyService";
import axios from "axios";

export const addBudget = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { token, amount, category, currency } = data;

  if (!token) return { reply: "Lỗi xác thực." };
  if (!amount) return { reply: "Bạn muốn đặt ngân sách là bao nhiêu?" };

  // Lấy thời gian hiện tại
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const apiClient = createFinTrackApiClient(token);

  try {
    // 1. BƯỚC ĐỌC (GET): Kiểm tra xem ngân sách tháng này đã có chưa
    let existingBudget: any = null;
    try {
      const resGet = await apiClient.get("/budget", {
        params: { month: currentMonth, year: currentYear }
      });
      // Giả sử API trả về null hoặc 404 nếu chưa có
      if (resGet.data && resGet.data.totalBudget) {
         existingBudget = resGet.data;
      }
    } catch (error) {
      // Nếu lỗi 404 nghĩa là chưa có ngân sách, ta sẽ tạo mới.
      // Các lỗi khác thì throw ra ngoài.
      if (axios.isAxiosError(error) && error.response?.status !== 404) {
        throw error; 
      }
    }

    // 2. BƯỚC CHUẨN BỊ DỮ LIỆU (MODIFY)
    // Cấu trúc mặc định nếu chưa có
    let payload = {
      month: currentMonth,
      year: currentYear,
      // Ưu tiên lấy từ existingBudget nếu có (nhớ map đúng key)
      totalAmount: existingBudget ? existingBudget.totalBudget : 0, 
      categories: existingBudget ? existingBudget.categoryStats : [],
      currency: currency || (existingBudget ? existingBudget.originalCurrency : "VND")
    };

    const isSettingTotal = !category || category === "TOTAL";

    if (isSettingTotal) {
      // CASE A: User đặt "Tổng ngân sách"
      // VD: "Đặt ngân sách tháng này 10 triệu"
      payload.totalAmount = amount;
      // Giữ nguyên currency nếu user đổi ý (ví dụ nhập USD)
      if (currency) payload.currency = currency;

    } else {
      // CASE B: User đặt "Ngân sách danh mục" (VD: "Ăn uống 2 triệu")
      
      // 1. Tìm xem danh mục này đã có trong mảng categories chưa
      const catIndex = payload.categories.findIndex((c: any) => c.category === category);

      if (catIndex > -1) {
        // Nếu có rồi -> Cập nhật số tiền
        payload.categories[catIndex].amount = amount;
      } else {
        // Nếu chưa có -> Thêm mới vào mảng
        payload.categories.push({
          category: category,
          amount: amount
        });
      }

      // 2. Logic Tự động tăng Tổng ngân sách (Optional nhưng User-friendly)
      // Nếu user đặt ngân sách con mà lớn hơn tổng ngân sách hiện tại,
      // ta nên tự động update tổng ngân sách để tránh lỗi logic.
      const sumSubBudgets = payload.categories.reduce((sum: number, c: any) => sum + c.amount, 0);
      if (sumSubBudgets > payload.totalAmount) {
         // Cách 1: Tự động nâng tổng ngân sách lên bằng tổng các con
         payload.totalAmount = sumSubBudgets; 
         
         // Cách 2: Hoặc giữ nguyên và để Backend cảnh báo (tùy logic backend của bạn)
      }
    }

    if (existingBudget && existingBudget.categoryStats) {
        payload.categories = existingBudget.categoryStats.map((c: any) => ({
            category: c.category,
            amount: c.originalBudgetedAmount || c.amount // Đảm bảo lấy đúng số tiền gốc
        }));
    }

    // 3. BƯỚC GHI (POST/PUT)
    // Backend của bạn nên dùng cùng 1 endpoint để Tạo mới hoặc Cập nhật (Upsert)
    const resPost = await apiClient.post("/budget", payload);

    console.log("Budget updated:", resPost.data);

    // 4. Chuẩn bị dữ liệu để reply
    // Ta gửi kèm thông tin là đang set "TOTAL" hay "CATEGORY" để formatter biết
    const replyData = {
      ...resPost.data.budget, // Dữ liệu budget hoàn chỉnh từ backend
      _updatedCategory: isSettingTotal ? "TOTAL" : category // Marker để formatter biết vừa sửa cái gì
    };

    const replyString = await generateReply("add_budget", replyData, null);

    return {
      reply: replyString,
      data: replyData
    };

  } catch (error) {
    console.error("Lỗi add budget:", error);
    return { reply: "Không thể thiết lập ngân sách lúc này. Vui lòng thử lại sau." };
  }
};