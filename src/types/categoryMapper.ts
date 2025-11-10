// File: src/utils/categoryMapper.ts

/**
 * Chuẩn hóa một chuỗi (lowercase, bỏ dấu) để tra cứu
 * Ví dụ: "Ăn Uống" -> "an uong"
 */
const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
    .replace(/đ/g, "d"); // Chuyển 'đ' thành 'd'
};

/**
 * Ánh xạ từ TỪ KHÓA (đã chuẩn hóa) sang KEY CỦA HỆ THỐNG (DB).
 * Đây là nơi bạn thêm tất cả các từ đồng nghĩa mà người dùng có thể nói.
 */
const CATEGORY_KEY_MAP: Record<string, string> = {
  // === EXPENSE ===
  "an uong": "food",
  "ca phe": "food",
  "nha hang": "food",
  "an sang": "food",
  "an toi": "food",

  "di chuyen": "transportation",
  "taxi": "transportation",
  "grab": "transportation",
  "xang": "transportation",
  "xe bus": "transportation",

  "giao duc": "education",
  "hoc phi": "education",
  "sach vo": "education",

  "giai tri": "entertainment",
  "xem phim": "entertainment",
  "choi game": "entertainment",

  "mua sam": "shopping",
  "quan ao": "shopping",

  "nha o": "housing",
  "nha cua": "housing",
  "tien nha": "housing",
  "dien": "housing", 
  "nuoc": "housing", 

  "suc khoe": "health",
  "thuoc": "health",
  "kham benh": "health",

  "du lich": "travel",
  "ve may bay": "travel",

  "thue nha": "rent",
  
  "tiet kiem": "saving",
  "bo heo": "saving",
  
  "khac": "other",

  // === INCOME ===
  "ban hang": "sales",
  "thuong": "bonus",
  "tien thuong": "bonus",

  "luong": "salary",
  "tien luong": "salary",

  "dau tu": "investment",
  "lai suat": "investment",
};

// --- BẢN ĐỒ ÁNH XẠ NGƯỢC (MỚI) ---
// Ánh xạ từ KEY HỆ THỐNG sang TÊN HIỂN THỊ (Tiếng Việt)
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  // Expense
  "food": "Ăn uống",
  "transportation": "Di chuyển",
  "education": "Giáo dục",
  "entertainment": "Giải trí",
  "shopping": "Mua sắm",
  "housing": "Nhà ở",
  "health": "Sức khỏe",
  "travel": "Du lịch",
  "rent": "Thuê nhà",
  "saving": "Tiết kiệm",
  "other": "Khác",

  // Income
  "sales": "Bán hàng",
  "bonus": "Tiền thưởng",
  "salary": "Lương",
  "investment": "Đầu tư",
};

/**
 * Hàm chính để tra cứu
 * Nhận "Ăn uống" hoặc "cà phê" và trả về "food"
 * @param rawKeyword Từ khóa thô do AI trích xuất (ví dụ: "Ăn uống")
 * @returns Key hệ thống (ví dụ: "food") hoặc undefined
 */
export const normalizeCategory = (rawKeyword: string): string | undefined => {
  if (!rawKeyword) return undefined;

  const normalizedKey = normalizeText(rawKeyword);

  // 1. Tra cứu trong map
  const systemKey = CATEGORY_KEY_MAP[normalizedKey];
  if (systemKey) {
    return systemKey; // Ví dụ: "an uong" -> "food"
  }

  // 2. Fallback: Kiểm tra xem từ khóa thô có phải là key hệ thống không
  // (Phòng trường hợp AI trích xuất 'food' thay vì 'ăn uống')
  const allSystemKeys = new Set(Object.values(CATEGORY_KEY_MAP));
  if (allSystemKeys.has(rawKeyword.toLowerCase())) {
    return rawKeyword.toLowerCase(); // Trả về "food" nếu đầu vào là "food"
  }

  // 3. Không tìm thấy
  console.warn(`[CategoryMapper] Không tìm thấy ánh xạ cho: "${rawKeyword}"`);
  return undefined; // Rất quan trọng: Trả về undefined
};

/**
 * Lấy tên hiển thị tiếng Việt từ key hệ thống
 * @param key - Key hệ thống (ví dụ: "food")
 * @returns Tên hiển thị (ví dụ: "Ăn uống")
 */
export const getCategoryDisplayName = (key: string): string => {
  if (!key) return "Không rõ";
  // Trả về tên tiếng Việt, nếu không có thì fallback về chính key đó
  return CATEGORY_DISPLAY_MAP[key.toLowerCase()] || key;
};
