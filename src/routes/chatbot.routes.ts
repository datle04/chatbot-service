// src/routes/chatbot.routes.ts
import express from "express";
import { handleChat } from "../controller/chatbot.controller";
import { verifyUser } from "../middlewares/verifyUser";

const router = express.Router();
router.post("/", handleChat);
export default router;
