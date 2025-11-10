"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const chatbot_routes_1 = __importDefault(require("./routes/chatbot.routes"));
const app = (0, express_1.default)();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: FRONTEND_URL, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use('/static', express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/chat', chatbot_routes_1.default);
// Routes
app.get('/', (req, res) => {
    res.send('Chatbot service API is running');
});
exports.default = app;
