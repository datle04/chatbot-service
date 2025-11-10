import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { AuthRequest } from "../types";

export const verifyUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Lấy token từ cookie thay vì header
  // Tên cookie phải khớp với tên bạn đặt ở backend (ví dụ: 'accessToken')
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Missing authorization cookie" });
  }

  try {
    // 2. Gửi token sang backend FinTrack để xác thực
    // API của FinTrack có thể vẫn mong đợi một payload JSON { token: "..." }
    const response = await axios.post(
      `${process.env.FINTRACK_API_URL}/auth/verify`,
      { token } // Gửi token lấy từ cookie
    );

    if (!response.data.valid) {
      // Điều này có thể không bao giờ chạy nếu API FinTrack trả về lỗi 401
      return res.status(401).json({ message: "Invalid token" });
    }

    // 3. Gắn thông tin user và token vào request
    req.user = response.data.user;
    req.userToken = token; // Lưu lại token từ cookie
    next();
  } catch (error) {
    console.error("verifyUser error:", error);

    // 4. Xử lý lỗi (ví dụ: token hết hạn/không hợp lệ từ FinTrack)
    // Nếu API FinTrack trả về lỗi 401, axios sẽ ném ra lỗi
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Các lỗi khác (ví dụ: API FinTrack không thể truy cập)
    return res.status(500).json({ message: "Internal server error during auth" });
  }
};