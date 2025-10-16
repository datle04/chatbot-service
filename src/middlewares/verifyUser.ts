import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { AuthRequest } from "../types";

export const verifyUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    // ✅ Gửi token sang backend FinTrack để xác thực
    const response = await axios.post(`${process.env.FINTRACK_API_URL}/auth/verify`, { token });

    if (!response.data.valid) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = response.data.user;     // chứa thông tin user
    req.userToken = token;             // ✅ giữ lại token để sử dụng ở service khác
    next();
  } catch (error) {
    console.error("verifyUser error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
