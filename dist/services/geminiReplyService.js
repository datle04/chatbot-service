"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReply = void 0;
// src/services/geminiReplyService.ts
const geminiService_1 = require("./geminiService");
const generateReply = async (intent, data, timeRange) => {
    if (!data || (Array.isArray(data.data) && data.data.length === 0 && !data.summary)) {
        return `Rất tiếc, mình không tìm thấy dữ liệu nào trong khoảng thời gian từ ${timeRange.startDate} đến ${timeRange.endDate}.`;
    }
    const dataString = JSON.stringify(data, null, 2);
    let userRequestInstruction = ""; // Chỉ dùng để lưu chỉ dẫn
    // BƯỚC 1: Dùng switch ĐỂ CHUẨN BỊ chỉ dẫn
    switch (intent) {
        case "total_expense":
            userRequestInstruction = `Viết một câu thông báo tổng chi tiêu trong khoảng thời gian từ ${timeRange.startDate} đến ${timeRange.endDate}.`;
            break;
        case "total_income":
            userRequestInstruction = `Viết một câu thông báo tổng thu nhập trong khoảng thời gian từ ${timeRange.startDate} đến ${timeRange.endDate}.`;
            break;
        case "saving_summary":
            userRequestInstruction = `Viết một bản tóm tắt tình hình tiết kiệm dựa trên object 'summary'. Nếu số dư (summary.balance) > 0, hãy chúc mừng họ. Nếu ngược lại, hãy đưa ra lời khuyên nhẹ nhàng.`;
            break;
        case "list_transactions":
            userRequestInstruction = `Liệt kê tối đa 5 giao dịch đầu tiên một cách gọn gàng, và cho biết có bao nhiêu giao dịch khác nếu có.`;
            break;
        case "list_recurring":
            userRequestInstruction = `Viết một câu thông báo cho người dùng biết hiện tại người dùng đang có bao nhiêu giao dịch recurring.`;
            break;
        case "highest_expense":
            userRequestInstruction = `Thông báo về khoản chi lớn nhất của người dùng.`;
            break;
        case "lowest_expense":
            userRequestInstruction = `Thông báo về khoản chi nhỏ nhất của người dùng.`;
            break;
        case "highest_income":
            userRequestInstruction = `Thông báo về khoản thu nhập lớn nhất của người dùng.`;
            break;
        case "lowest_income":
            userRequestInstruction = `Thông báo về khoản thu nhập nhỏ nhất của người dùng.`;
            break;
        case "top_spending_category":
            userRequestInstruction = `Viết một câu thông báo về danh mục chi tiêu lớn nhất trong khoảng thời gian tử ${timeRange.startDate} đến ${timeRange.endDate}.`;
            break;
        case "top_income_category":
            userRequestInstruction = `Viết một câu thông báo về danh mục thu nhập lớn nhất trong khoảng thời gian tử ${timeRange.startDate} đến ${timeRange.endDate}.`;
            break;
        case "compare_income_vs_expense":
            userRequestInstruction = `So sánh tổng thu và tổng chi, cho người dùng biết chênh lệch là bao nhiêu.`;
            break;
        case "average_spending_base_on_income":
            userRequestInstruction = `
            **Nhiệm vụ của bạn là tính toán và trả lời DUY NHẤT về mức chi tiêu tối đa mà người dùng có thể chi mỗi ngày.**
            1.  Lấy tổng thu nhập \`summary.totalIncome\`.
            2.  Lấy tổng số ngày \`days\`.
            3.  Thực hiện phép chia: \`summary.totalIncome / days\`.
            4.  Tạo câu trả lời thông báo kết quả phép chia đó.
            `;
            break;
        case "average_spending_base_on_expense":
            userRequestInstruction = `
            **Nhiệm vụ của bạn là tính toán và trả lời DUY NHẤT về mức chi tiêu trung bình mỗi ngày.**
            1.  Lấy tổng chi tiêu \`summary.totalExpense\`.
            2.  Lấy tổng số ngày \`days\`.
            3.  Thực hiện phép chia: \`summary.totalExpense / days\`.
            4.  Tạo câu trả lời thông báo kết quả phép chia đó.
        `;
            break;
        case "spending_trend":
            userRequestInstruction = `
        **Nhiệm vụ: Phân tích xu hướng chi tiêu như một chuyên gia tài chính.**
        Dữ liệu cung cấp là một chuỗi chi tiêu theo từng tháng.
        1.  Phân tích toàn bộ chuỗi dữ liệu để xác định xu hướng chung (tăng 📈, giảm 📉, hay không ổn định 📊).
        2.  Tính tổng chi tiêu của toàn bộ giai đoạn.
        3.  Đưa ra một nhận xét ngắn gọn, thông minh và thân thiện.
        
        **Ví dụ về giọng văn:**
        - **Nếu giảm:** "Thật tuyệt vời! Phân tích cho thấy bạn đang kiểm soát chi tiêu rất tốt, với xu hướng giảm rõ rệt trong những tháng qua. 👍"
        - **Nếu tăng:** "Hãy chú ý nhé! Dữ liệu cho thấy chi tiêu của bạn có xu hướng tăng lên trong giai đoạn này. Hãy cùng xem lại các khoản chi để điều chỉnh nhé. 😟"
        - **Nếu không ổn định:** "Chi tiêu của bạn trong giai đoạn này khá biến động. Có những tháng bạn chi tiêu rất hiệu quả, nhưng cũng có những tháng chi tiêu tăng cao. 📊"
        `;
            break;
        case "income_trend":
            userRequestInstruction = `
        **Nhiệm vụ: Phân tích xu hướng thu nhập như một chuyên gia tài chính.**
        Dữ liệu cung cấp là một chuỗi thu nhập theo từng tháng.
        1.  Phân tích toàn bộ chuỗi dữ liệu để xác định xu hướng chung (tăng 📈, giảm 📉, hay không ổn định 📊).
        2.  Tính tổng thu nhập của toàn bộ giai đoạn.
        3.  Đưa ra một nhận xét ngắn gọn, thông minh và thân thiện.

        **Ví dụ về giọng văn:**
        - **Nếu tăng:** "Chúc mừng bạn! Thu nhập của bạn có xu hướng tăng trưởng rất tích cực trong giai đoạn vừa qua. Đây là một dấu hiệu tuyệt vời! 🎉"
        - **Nếu giảm:** "Có vẻ như thu nhập của bạn đang có xu hướng giảm trong giai đoạn này. Bạn có thể xem xét các nguồn thu nhập để cải thiện nhé. 😟"
        - **Nếu không ổn định:** "Thu nhập của bạn trong giai đoạn này khá biến động. Hãy cùng xem xét để có thể ổn định hơn nguồn thu bạn nhé. 📊"
        `;
            break;
        default:
            return "Mình đã có dữ liệu nhưng chưa biết cách diễn đạt. Bạn có thể hỏi lại được không?";
    }
    // BƯỚC 2: TẠO PROMPT CUỐI CÙNG SAU KHI ĐÃ CÓ ĐỦ THÔNG TIN
    const prompt = `Bạn là một trợ lý tài chính ảo thân thiện tên là FinAI.
    Dựa vào dữ liệu JSON sau đây, hãy tạo một câu trả lời bằng tiếng Việt cho người dùng, đơn vị tiền được sử dụng là vnđ.
    Giọng văn: Vui vẻ, khích lệ, rõ ràng và sử dụng emoji phù hợp.

    Dữ liệu:
    \`\`\`json
    ${dataString}
    \`\`\`

    Chỉ dẫn: ${userRequestInstruction}
  `;
    const reply = await (0, geminiService_1.askGemini)(prompt);
    return reply;
};
exports.generateReply = generateReply;
