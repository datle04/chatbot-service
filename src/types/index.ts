export type ChatContext = {
    lastIntent?: string;
    lastTimeRange?: { start: Date; end: Date };
    lastTimeText?: string;
};

import { Request } from "express";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
  dob?: string;
  phone?: string;
  address?: string;
  isBanned?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  userToken?: string;
}

export type MessageRole = 'user' | 'model'; // Role trong cuộc hội thoại

export interface Message {
  role: MessageRole;
  text: string;
}

// Kiểu dữ liệu trả về theo yêu cầu của bạn
export interface BotResponse {
  reply: string; // Câu trả lời thân thiện từ Gemini
  data: any;   // Có thể là dữ liệu thô, hoặc metadata/updated history
}
