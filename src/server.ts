import dotenv from "dotenv";
dotenv.config();
import http from 'http';
import app from "./app";

const PORT = process.env.PORT || 4001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Khởi tạo server từ app
const server = http.createServer(app);

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect:", err);
  }
};

startServer();