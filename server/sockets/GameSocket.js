import jwt from 'jsonwebtoken';
import { Player } from '../game/Player.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'quiz_app_secret_key';

export default function setupSocket(socket, io, gameRoom) {
    let player = null;

    const token = socket.handshake.cookies?.token
        || socket.handshake.headers?.cookie?.split('; ')
            .find(row => row.startsWith('token='))?.split('=')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            if (gameRoom.isPlayerKicked(decoded.id)) {
                socket.emit('sessionRestored', { isKicked: true });
                return;
            }

            player = gameRoom.restorePlayer(decoded.id, socket.id);
            if (player) {
                let currentQuestion = null;
                let countdownData = null;

                if (gameRoom.gameState === 'COUNTDOWN') {
                    countdownData = {
                        countdownTime: gameRoom.countdownTime,
                        isLobbyPaused: gameRoom.isLobbyPaused
                    };
                }

                if (gameRoom.gameState === 'QUESTION') {
                    currentQuestion = gameRoom.questions[gameRoom.currentQuestionIndex];
                }

                socket.emit('sessionRestored', {
                    id: player.id,
                    nickname: player.nickname,
                    avatarUrl: player.avatarUrl,
                    isHost: player.isHost,
                    score: player.score,
                    abilities: player.abilities,
                    gameState: gameRoom.gameState,
                    quizName: gameRoom.quizName,
                    currentQuestionIndex: gameRoom.currentQuestionIndex,
                    currentQuestion: currentQuestion,
                    isPaused: gameRoom.isPaused,
                    remainingTime: gameRoom.remainingTime,
                    isLobbyPaused: (countdownData ? countdownData.isLobbyPaused : gameRoom.isLobbyPaused),
                    countdownTime: (countdownData ? countdownData.countdownTime : gameRoom.countdownTime),
                    displayedQuestionNumber: gameRoom.displayedQuestionNumber,
                    gameResults: gameRoom.gameState === 'RESULTS' ? gameRoom.calculateResults() : null,
                    totalQuestions: gameRoom.questions.length
                });
            }
        } catch (e) {
            console.log('Не получилось восстановить сессию по токену:', e.message);
            socket.emit('invalidateToken');
        }
    }

    socket.on('join', ({ nickname, avatarUrl }, callback) => {
        try {
            if (gameRoom.players.length >= 10) {
                return callback({ error: 'Комната заполнена' });
            }

            const playerId = uuidv4();
            player = new Player(playerId, nickname, avatarUrl);
            gameRoom.addPlayer(player);

            const token = jwt.sign({ id: playerId }, JWT_SECRET, { expiresIn: '1h' });
            callback({
                token,
                isHost: player.isHost,
                playerId: player.id,
                quizName: gameRoom.quizName
            });
        } catch (e) {
            console.error('Join error:', e);
            callback({ e: 'Ошибка подключения к игре' });
        }
    });

    socket.on('startGame', () => {
        if (player && player.isHost) {
            gameRoom.startCountdown();
        }
    });

    socket.on('startCountdown', () => {
        if (player && player.isHost) {
            gameRoom.startCountdown();
        }
    });

    socket.on('toggleCountdownPause', () => {
        if (player && player.isHost) {
            gameRoom.toggleCountdownPause();
        }
    });

    socket.on('cancelCountdown', () => {
        if (player && player.isHost) {
            gameRoom.cancelCountdown();
        }
    });

    socket.on('endGame', () => {
        if (player && player.isHost) {
            gameRoom.endGame();
        }
    });

    socket.on('pauseGame', () => {
        if (player && player.isHost) {
            gameRoom.pauseGame();
        }
    });

    socket.on('kickPlayer', (playerId) => {
        const player = gameRoom.removePlayer(playerId);
    });

    socket.on('answer', ({ questionId, answerId }) => {
        if (player) {
            gameRoom.handleAnswer(player.id, questionId, answerId);
        }
    });

    socket.on('sendMessage', (message) => {
        if (!player) return;
        const messageWithSender = {
            ...message,
            playerId: socket.id,
            nickname: player?.nickname || "Анонимус",
            timestamp: Date.now()
        };
        gameRoom.addMessage(messageWithSender);
    });

    socket.on('requestChatHistory', () => {
        socket.emit('chatHistory', gameRoom.messages);
      });

    socket.on('useAbility', ({ abilityType, targetPlayerId }) => {
        if (player) {
            gameRoom.useAbility(player.id, abilityType, targetPlayerId);
            socket.emit('abilityUsed', { success: true, abilityType });
        }
    });

    socket.on('disconnect', () => {
        if (player) {
            player.connected = false;
            gameRoom.notifyPlayers();
        }
    });
};