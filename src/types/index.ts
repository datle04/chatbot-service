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
