import dayjs from "dayjs";
import { askGemini } from "./geminiService";

/**
 * 🧠 Hàm phân tích khoảng thời gian tự nhiên trong ngôn ngữ người dùng (tháng / quý / năm)
 * Hỗ trợ tiếng Việt + tiếng Anh cơ bản
 */
export const extractMonthRange = (prompt: string) => {
  const now = new Date();
  let startMonth = now.getMonth() + 1;
  let startYear = now.getFullYear();
  let endMonth = startMonth;
  let endYear = startYear;

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const text = normalize(prompt);

  const monthYearRegex = /(?:thang\s*)?(\d{1,2})(?:\/|\s*(?:nam)?\s*)(\d{4})?/gi;
  const matches = [...text.matchAll(monthYearRegex)];

  const months = matches.map((m) => parseInt(m[1]));
  const years = matches.map((m) => (m[2] ? parseInt(m[2]) : now.getFullYear()));

  // ✅ "từ ... đến ..."
  if (text.includes("tu") && text.includes("den") && months.length >= 2) {
    startMonth = months[0];
    startYear = years[0];
    endMonth = months[1];
    endYear = years[1];
  } else if (months.length === 1) {
    startMonth = endMonth = months[0];
    startYear = endYear = years[0];
  }

  // ✅ Các từ khóa ngữ nghĩa
  if (/thang\s*nay|this\s*month/i.test(text)) {
    startMonth = endMonth = now.getMonth() + 1;
    startYear = endYear = now.getFullYear();
  }
  if (/thang\s*truoc|last\s*month/i.test(text)) {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    startMonth = endMonth = prev.getMonth() + 1;
    startYear = endYear = prev.getFullYear();
  }
  if (/thang\s*sau|next\s*month/i.test(text)) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    startMonth = endMonth = next.getMonth() + 1;
    startYear = endYear = next.getFullYear();
  }

  // ✅ "năm nay" / "năm ngoái" / "năm sau"
  if (/nam\s*nay|this\s*year/i.test(text)) {
    startMonth = 1; endMonth = 12;
    startYear = endYear = now.getFullYear();
  }
  if (/nam\s*truoc|last\s*year/i.test(text)) {
    startMonth = 1; endMonth = 12;
    startYear = endYear = now.getFullYear() - 1;
  }
  if (/nam\s*sau|next\s*year/i.test(text)) {
    startMonth = 1; endMonth = 12;
    startYear = endYear = now.getFullYear() + 1;
  }

  // ✅ Quý
  const quarterMatch = text.match(/quy\s*(\d)|quarter\s*(\d)/i);
  if (quarterMatch) {
    const q = parseInt(quarterMatch[1]);
    startMonth = (q - 1) * 3 + 1;
    endMonth = q * 3;
    startYear = endYear = now.getFullYear();
  }

  // ✅ "nửa năm đầu / nửa năm sau"
  if (/nua\s*nam\s*(nay|dau)/i.test(text)) {
    startMonth = 1; endMonth = 6;
    startYear = endYear = now.getFullYear();
  }
  if (/nua\s*nam\s*sau/i.test(text)) {
    startMonth = 7; endMonth = 12;
    startYear = endYear = now.getFullYear();
  }

  // ✅ "từ đầu năm đến hiện tại"
  if (/tu\s*dau\s*nam/i.test(text) && /(hien\s*tai|bay\s*gio|toi\s*gio|den\s*nay)/i.test(text)) {
    startMonth = 1;
    startYear = now.getFullYear();
    endMonth = now.getMonth() + 1;
    endYear = now.getFullYear();
  }

  // ✅ "x tháng gần đây" / "x tháng qua"
  const recentMatch = text.match(/(\d+)\s*thang\s*(gan\s*day|qua)|last\s*(\d+)\s*months/i);
  if (recentMatch) {
    const n = parseInt(recentMatch[1] || recentMatch[3]);
    const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
    startMonth = start.getMonth() + 1;
    startYear = start.getFullYear();
    endMonth = now.getMonth() + 1;
    endYear = now.getFullYear();
  }

  // ✅ Điều chỉnh khi startMonth > endMonth (ví dụ: “từ tháng 11 đến tháng 2”)
  if (startYear === endYear && startMonth > endMonth) {
    endYear += 1;
  }

  return { startMonth, startYear, endMonth, endYear };
};

/**
 * ⚡ Regex detection nhanh cho các mẫu thời gian phổ biến
 */
const extractTimeRangeRegex = (question: string) => {
  const text = question.toLowerCase();
  const now = dayjs();

  const patterns = [
    { regex: /\bhôm nay\b/, type: "relative", ref: "today", range: [now.startOf("day"), now.endOf("day")] },
    { regex: /\bngày mai\b/, type: "relative", ref: "tomorrow", range: [now.add(1, "day").startOf("day"), now.add(1, "day").endOf("day")] },
    { regex: /\bhôm qua\b/, type: "relative", ref: "yesterday", range: [now.subtract(1, "day").startOf("day"), now.subtract(1, "day").endOf("day")] },
    { regex: /\btuần này\b/, type: "relative", ref: "this_week", range: [now.startOf("week"), now.endOf("week")] },
    { regex: /\btuần trước\b/, type: "relative", ref: "last_week", range: [now.subtract(1, "week").startOf("week"), now.subtract(1, "week").endOf("week")] },
    { regex: /\btháng này\b/, type: "relative", ref: "this_month", range: [now.startOf("month"), now.endOf("month")] },
    { regex: /\btháng trước\b/, type: "relative", ref: "last_month", range: [now.subtract(1, "month").startOf("month"), now.subtract(1, "month").endOf("month")] },
    { regex: /\b7 ngày qua\b/, type: "dynamic", ref: "last_7_days", range: [now.subtract(7, "day").startOf("day"), now.endOf("day")] },
    { regex: /\b30 ngày qua\b/, type: "dynamic", ref: "last_30_days", range: [now.subtract(30, "day").startOf("day"), now.endOf("day")] },
  ];

  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match) {
      return {
        type: p.type,
        language: "vi",
        reference: p.ref ?? null,
        startDate: p.range[0].format("YYYY-MM-DD"),
        endDate: p.range[1].format("YYYY-MM-DD"),
      };
    }
  }

  return null;
};

/**
 * 🤖 Fallback sang Gemini khi regex không bắt được
 */
const extractTimeRangeLLM = async (question: string) => {
  const prompt = `
Bạn là hệ thống phân tích câu hỏi tài chính đa ngôn ngữ.
Hãy xác định khoảng thời gian trong câu hỏi này và trả về JSON như sau:

{
  "language": "vi" | "en" | null,
  "type": "absolute" | "relative" | "dynamic" | "comparison" | "unknown",
  "reference": "today" | "this_week" | "last_month" | "last_7_days" | null,
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null
}

Câu hỏi: "${question}"
`;

  const raw = await askGemini(prompt);
  try {
    return JSON.parse(raw);
  } catch {
    return { type: "unknown", startDate: null, endDate: null };
  }
};

/**
 * 🌏 Hàm chính — kết hợp Regex + extractMonthRange + Gemini fallback
 */
export const extractTimeRange = async (question: string) => {
  // 1️⃣ Regex nhanh
  const regexResult = extractTimeRangeRegex(question);
  if (regexResult) return regexResult;

  // 2️⃣ Xử lý tháng / quý / năm bằng extractMonthRange
  const monthRange = extractMonthRange(question);
  if (monthRange) {
    const { startMonth, startYear, endMonth, endYear } = monthRange;
    const startDate = dayjs(`${startYear}-${String(startMonth).padStart(2, "0")}-01`);
    const endDate = dayjs(`${endYear}-${String(endMonth).padStart(2, "0")}-01`).endOf("month");

    return {
      type: "relative",
      language: "vi",
      reference: "month_range",
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    };
  }

  // 3️⃣ Fallback sang LLM
  const llmResult = await extractTimeRangeLLM(question);
  return llmResult;
};

/**
 * Hàm tính tổng số ngày dựa vào startDate và endDate
 */
export const calculateTotalDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Kiểm tra tính hợp lệ
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Ngày không hợp lệ");
  }

  // Tính chênh lệch thời gian (ms)
  const diffMs = end.getTime() - start.getTime();

  // 1 ngày = 1000ms * 60s * 60m * 24h
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return diffDays;
};
