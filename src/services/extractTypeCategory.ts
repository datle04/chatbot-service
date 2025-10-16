// 📘 Từ điển danh mục có thể mở rộng
const categoryDictionary: Record<string, string[]> = {
  food: [
    "ăn",
    "uống",
    "cà phê",
    "quán ăn",
    "nhà hàng",
    "buffet",
    "trà sữa",
    "ăn sáng",
    "ăn trưa",
    "ăn tối",
    "mì",
    "phở",
    "bún",
    "cơm",
    "đặt đồ ăn",
    "grabfood",
    "baemin",
    "gofood",
  ],
  transportation: [
    "xe",
    "taxi",
    "xăng",
    "bus",
    "grab",
    "be",
    "di chuyển",
    "vé xe",
    "bảo dưỡng xe",
    "rửa xe",
    "gửi xe",
    "phí cầu đường",
    "vé tàu",
    "vé máy bay",
  ],
  shopping: [
    "mua sắm",
    "quần áo",
    "giày dép",
    "shopee",
    "tiki",
    "lazada",
    "đi chợ",
    "mỹ phẩm",
    "điện thoại",
    "phụ kiện",
    "tai nghe",
    "đồ công nghệ",
    "balo",
    "đồng hồ",
    "đồ gia dụng",
    "mua đồ",
  ],
  salary: [
    "lương",
    "thưởng",
    "trả công",
    "thu nhập chính",
    "tiền công",
    "tiền lương",
    "payroll",
    "salary",
  ],
  rent: [
    "tiền nhà",
    "thuê nhà",
    "phòng trọ",
    "nhà trọ",
    "tiền trọ",
    "cọc nhà",
    "thuê phòng",
  ],
  housing: [
    "điện",
    "nước",
    "internet",
    "wifi",
    "truyền hình",
    "rác",
    "vệ sinh",
    "sửa nhà",
    "mua đồ nhà",
    "bảo trì nhà",
  ],
  health: [
    "bệnh viện",
    "khám",
    "thuốc",
    "bảo hiểm y tế",
    "xét nghiệm",
    "nha khoa",
    "tiêm",
    "khẩu trang",
    "vitamin",
    "dinh dưỡng",
  ],
  sales: [
    "bán hàng",
    "doanh thu",
    "thu nhập phụ",
    "tiền bán đồ",
    "chốt đơn",
    "shop",
    "order",
    "bán online",
    "bán quần áo",
    "bán giày",
    "bán hàng shopee",
    "thu tiền từ khách",
    "nhận thanh toán",
    "bán đồ cũ",
    "chợ tốt",
    "facebook marketplace",
  ],
  bonus: [
    "thưởng thêm",
    "bonus",
    "hoa hồng",
    "lì xì",
    "tiền thưởng",
    "tiền thưởng tết",
    "phụ cấp",
    "support",
    "tip",
    "tiền tip",
    "bù lương",
    "hỗ trợ",
    "commission",
    "incentive",
  ],
  invest: [
    "đầu tư",
    "chứng khoán",
    "cổ phiếu",
    "coin",
    "crypto",
    "bitcoin",
    "bnb",
    "eth",
    "usdt",
    "lợi nhuận",
    "trade",
    "lãi suất",
    "gửi tiết kiệm",
    "bank interest",
    "đầu tư quỹ",
    "nạp coin",
    "rút coin",
    "đầu tư forex",
    "lợi nhuận đầu tư",
    "lãi đầu tư",
  ],
  education: [
    "học phí",
    "học thêm",
    "học tiếng anh",
    "trung tâm",
    "khóa học",
    "online course",
    "khoá học udemy",
    "mua sách",
    "tài liệu học",
    "thi cử",
    "gia sư",
    "học phí đại học",
    "học phí trung tâm",
  ],
  entertainment: [
    "giải trí",
    "xem phim",
    "netflix",
    "spotify",
    "apple music",
    "xem concert",
    "chơi game",
    "steam",
    "mua game",
    "nạp game",
    "xem bóng đá",
    "đi du lịch",
    "travel",
    "du lịch",
    "karaoke",
    "ăn chơi",
    "đi bar",
    "đi cafe",
    "vé xem phim",
    "rạp phim",
    "mua vé",
  ],
};

interface ExtractResult {
  type?: string;
  category?: string;
}

export const extractTypeAndCategory = (prompt: string): ExtractResult => {
  const lower = prompt.toLowerCase();

  const result: ExtractResult = {};

  // 🏷️ Xác định type
  if (/(thu nhập|nhận|có thêm|kiếm được|được trả|lương|doanh thu)/.test(lower)) {
    result.type = "income";
  } else if (/(chi|mất|tiêu|mua|trả tiền|tốn|đã thanh toán|chi tiêu)/.test(lower)) {
    result.type = "expense";
  }

  // 🗂️ Xác định category
  for (const [key, keywords] of Object.entries(categoryDictionary)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        result.category = key;
        break;
      }
    }
    if (result.category) break;
  }

  return result;
};
