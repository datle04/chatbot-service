// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import path from 'path';
import chatbotRoutes from './routes/chatbot.routes';

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/chat', chatbotRoutes);

// Routes

app.get('/', (req, res) => {
    res.send('Chatbot service API is running');
});

export default app;
