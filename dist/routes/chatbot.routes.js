"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/chatbot.routes.ts
const express_1 = __importDefault(require("express"));
const chatbot_controller_1 = require("../controller/chatbot.controller");
const verifyUser_1 = require("../middlewares/verifyUser");
const router = express_1.default.Router();
router.post("/", verifyUser_1.verifyUser, chatbot_controller_1.handleChat);
exports.default = router;
