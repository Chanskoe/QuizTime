import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import GameRoom from './game/GameRoom.js';
import setupSocket from './sockets/GameSocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3001',
        methods: ["GET", "POST"],
        credentials: true
    },
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const avatarDir = path.join(__dirname, 'public', 'avatars');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Неподдерживаемый тип файла'));
        }
    }
});

app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    res.json({ avatarUrl: `/avatars/${req.file.filename}` });
});

app.use('/avatars', express.static(avatarDir));

const gameRoom = new GameRoom(io);

io.on('connection', (socket) => {
    setupSocket(socket, io, gameRoom);
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Quiz Time</h1>');
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Клиент доступен по адресу: ${process.env.CLIENT_URL || 'http://localhost:3001'}`);
});

process.on('uncaughtException', (err) => {
    console.error('Неперехваченная ошибка:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Неперехваченный промис:', promise, 'причина:', reason);
});