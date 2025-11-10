"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = void 0;
const axios_1 = __importDefault(require("axios"));
const verifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Missing token" });
    try {
        // ✅ Gửi token sang backend FinTrack để xác thực
        const response = await axios_1.default.post(`${process.env.FINTRACK_API_URL}/auth/verify`, { token });
        if (!response.data.valid) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = response.data.user; // chứa thông tin user
        req.userToken = token; // ✅ giữ lại token để sử dụng ở service khác
        next();
    }
    catch (error) {
        console.error("verifyUser error:", error);
        return res.status(401).json({ message: "Unauthorized" });
    }
};
exports.verifyUser = verifyUser;
