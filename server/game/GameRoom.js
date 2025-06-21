import { Player } from './Player.js';

export default class GameRoom {
    constructor(io) {
        this.io = io;
        this.gameState = 'LOBBY';
        this.isPaused = false;
        this.players = [];
        this.kickedPlayers = new Map();
        this.hostId = null;
        this.currentQuestionIndex = 0;
        this.timerInterval = null;
        this.remainingTime = 0;
        this.countdownInterval = null;
        this.countdownTime = 0;
        this.isLobbyPaused = false;
        this.lobbyTimer = null;
        this.quizName = "Смешанная викторина для самых эрудированных";
        this.questions = [
            {
                id: 1,
                text: "Что из этого изобрели раньше?",
                answers: [
                    { id: 1, text: "Интернет" },
                    { id: 2, text: "Пицца-печь" },
                    { id: 3, text: "Скрепка для бумаг" },
                    { id: 4, text: "Мобильный телефон" }
                ],
                correctAnswerId: 3,
                type: 'text'
            },
            {
                id: 2,
                text: "Найди здесь волчонка!",
                answers: [
                    { id: 1, imageUrl: "/img/cat1.png" },
                    { id: 2, imageUrl: "/img/cat2.png" },
                    { id: 3, imageUrl: "/img/cat3.png" },
                    { id: 4, imageUrl: "/img/cat4.png" }
                ],
                correctAnswerId: 3,
                type: 'image'
            },
            {
                id: 3,
                text: "Где здесь ягода?",
                answers: [
                    { id: 1, text: "Виктория" },
                    { id: 2, text: "Топиока" },
                    { id: 3, text: "Оранж" },
                    { id: 4, text: "Костяника" }
                ],
                correctAnswerId: 1,
                type: 'text'
            },
            {
                id: 4,
                text: "Кто написал 'Войну и мир'?",
                answers: [
                    { id: 1, text: "Достоевский" },
                    { id: 2, text: "Толстой" },
                    { id: 3, text: "Пушкин" },
                    { id: 4, text: "Чехов" }
                ],
                correctAnswerId: 2,
                type: 'text'
            },
            {
                id: 5,
                text: "Любимая песня автора викторины?",
                answers: [
                    { id: 1, text: "Валентин Стрыкало - Решится само собой" },
                    { id: 2, text: "Pumped Up Kids - Foster The People" },
                    { id: 3, text: "Poker Face - Lady Gaga" },
                    { id: 4, text: "The Notorious B.I.G. - Nasty Girl" }
                ],
                correctAnswerId: 2,
                type: 'text'
            },
            {
                id: 6,
                text: "Сколько весит облако?",
                answers: [
                    { id: 1, text: "Как слон" },
                    { id: 2, text: "Как 10 самолетов" },
                    { id: 3, text: "Как перо" },
                    { id: 4, text: "Как 100 грузовиков" }
                ],
                correctAnswerId: 4,
                type: 'text'
            },
            {
                id: 7,
                text: "Что горит синим пламенем?",
                answers: [
                    { id: 1, text: "Бензин" },
                    { id: 2, text: "Спирт" },
                    { id: 3, text: "Угарный газ" },
                    { id: 4, text: "Древесина" }
                ],
                correctAnswerId: 3,
                type: 'text'
            },
            {
                id: 8,
                text: "Самое слепое животное?",
                answers: [
                    { id: 1, text: "Слон" },
                    { id: 2, text: "Кошка" },
                    { id: 3, text: "Змея" },
                    { id: 4, text: "Крот" }
                ],
                correctAnswerId: 4,
                type: 'text'
            },
            {
                id: 9,
                text: "Какой цвет не видит пчела?",
                answers: [
                    { id: 1, text: "Синий" },
                    { id: 2, text: "Желтый" },
                    { id: 3, text: "Красный" },
                    { id: 4, text: "Зеленый" }
                ],
                correctAnswerId: 3,
                type: 'text'
            },
            {
                id: 10,
                text: "Что из этого - рыба?",
                answers: [
                    { id: 1, text: "Дельфин" },
                    { id: 2, text: "Медуза" },
                    { id: 3, text: "Кальмар" },
                    { id: 4, text: "Рыба-луна" }
                ],
                correctAnswerId: 4,
                type: 'text'
            }
        ];
        this.abilities = [
            { type: 'right', description: 'Показать правильный ответ', canUse: true },
            { type: 'trick', description: 'Изменить ответ другого игрока', canUse: true },
            { type: 'help', description: 'Подсмотреть ответ у другого игрока', canUse: true },
            { type: 'steal', description: 'Украсть очки', canUse: true }
        ];
        this.messages = [];
        this.totalQuestions = this.questions.length;
        this.displayedQuestionNumber = 0;
    }

    setHost(playerId) {
        this.hostId = playerId;
        this.players.forEach(p => {
            p.isHost = p.id === playerId;
        });
    }

    addPlayer(player) {
        this.players.push(player);
        if (this.players.length === 1) {
            this.setHost(player.id);
        }
        this.sendSystemMessage(`${player.nickname} присоединился к игре`);
        this.notifyPlayers();
        return player;
    }

    cleanKickedPlayers() {
        const now = Date.now();
        const timeToThink = 1 * 60 * 1000;

        for (const [playerId, kickTime] of this.kickedPlayers.entries()) {
            if (now - kickTime > timeToThink) {
                this.kickedPlayers.delete(playerId);
            }
        }
    }

    isPlayerKicked(playerId) {
        this.cleanKickedPlayers();
        return this.kickedPlayers.has(playerId);
    }

    removePlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            this.players = this.players.filter(p => p.id !== playerId);
            this.kickedPlayers.set(playerId, Date.now());

            this.io.to(player.socketId).emit('kicked');

            this.sendSystemMessage(`${player.nickname} выгнан подумать о своём поведении...`);

            if (playerId === this.hostId && this.players.length > 0) {
                this.setHost(this.players[0].id);
            }
            this.notifyPlayers();
        }
        return player;
    }

    notifyPlayers() {
        this.io.emit('updatePlayers', this.players.map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatarUrl: p.avatarUrl,
            score: p.score,
            isHost: p.isHost,
            abilities: p.abilities
        })));
    }

    startGame() {
        this.assignAbilities();
        this.gameState = 'QUESTION';
        this.currentQuestionIndex = 0;
        this.displayedQuestionNumber = 0;
        this.io.emit('gameStateChange', this.gameState);
        this.nextQuestion();
    }

    endGame() {
        this.gameState = 'RESULTS';
        const results = this.calculateResults();
        this.io.emit('gameResults', results);
        this.io.emit('gameStateChange', this.gameState);
        clearInterval(this.timerInterval);
        this.kickedPlayers.clear();
        this.displayedQuestionNumber = 0;
    }

    addMessage(message) {
        this.messages.push(message);
        if (this.messages.length > 100) {
            this.messages.shift();
        }
        this.io.emit('newMessage', message);
    }

    startCountdown() {
        if (this.countdownInterval) return;

        if (this.countdownTime <= 0) {
            this.countdownTime = 10;
        }

        this.gameState = 'COUNTDOWN';
        this.isLobbyPaused = false;

        this.io.emit('gameStateChange', this.gameState);
        this.io.emit('updateCountdown', this.countdownTime);
        this.io.emit('lobbyPaused', false);
        this.sendSystemMessage("Удачи!");

        this.startCountdownTimer();
    }

    startCountdownTimer() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        this.countdownInterval = setInterval(() => {
            if (this.isLobbyPaused) return;

            this.countdownTime--;
            this.io.emit('updateCountdown', this.countdownTime);

            if (this.countdownTime <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.startGame();
            }
        }, 1000);
    }

    toggleCountdownPause() {
        if (this.gameState !== 'COUNTDOWN') return;

        this.isLobbyPaused = !this.isLobbyPaused;
        this.io.emit('lobbyPaused', this.isLobbyPaused);
    }

    cancelCountdown() {
        if (!this.countdownTimer) return;

        clearInterval(this.countdownTimer);
        this.countdownTimer = null;

        this.gameState = 'LOBBY';
        this.countdownTime = 0;
        this.isLobbyPaused = false;

        this.io.emit('gameStateChange', this.gameState);
        this.io.emit('updateCountdown', 0);
        this.io.emit('lobbyPaused', false);
    }

    checkAnswers(question) {
        this.players.forEach(player => {
            const playerAnswer = player.answers[question.id];
            if (playerAnswer && playerAnswer.answerId === question.correctAnswerId) {
                player.score += 100;

                if (Math.random() > 0.7 && player.abilities.length < 5) {
                    const availableAbilities = this.abilities.filter(a =>
                        !player.abilities.some(pa => pa.type === a.type)
                    );

                    if (availableAbilities.length > 0) {
                        const randomAbility = availableAbilities[
                            Math.floor(Math.random() * availableAbilities.length)
                        ];
                        player.abilities.push({ ...randomAbility });
                    }
                }
            }
        });

        this.io.emit('showAnswers', question.correctAnswerId);
        this.notifyPlayers();
    }

    nextQuestion() {
        this.displayedQuestionNumber++;

        this.io.emit('updateQuestionNumber', {
            current: this.displayedQuestionNumber,
            total: this.totalQuestions
        });

        const room = this;

        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame();
            return;
        }

        clearInterval(this.timerInterval);
        this.timerInterval = null;

        this.gameState = 'QUESTION';
        const question = this.questions[this.currentQuestionIndex];

        if (this.currentQuestionIndex === 0) {
            this.sendSystemMessage("Вот и первый вопрос!");
        } else if (this.currentQuestionIndex === this.questions.length - 1) {
            this.sendSystemMessage("Последний вопрос!");
        }

        this.io.emit('updateQuestion', question);
        this.io.emit('gameStateChange', this.gameState);

        this.startTimer(15, () => {
            room.checkAnswers(question);

            setTimeout(() => {
                room.currentQuestionIndex++;
                if (room.currentQuestionIndex < room.questions.length) {
                    room.nextQuestion();
                } else {
                    room.endGame();
                }
            }, 3000);
        });
        this.io.emit('updateQuestionNumber', {
            current: this.displayedQuestionNumber,
            total: this.totalQuestions
        });
    }

    assignAbilities() {
        this.players.forEach(player => {
            player.abilities = [];
            const availableAbilities = [...this.abilities];

            for (let i = 0; i < 2; i++) {
                if (availableAbilities.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableAbilities.length);
                    player.abilities.push({...availableAbilities[randomIndex]});
                    availableAbilities.splice(randomIndex, 1);
                }
            }
        });
        this.notifyPlayers();
    }

    calculateResults() {
        if (this.players.length === 0) {
            return null;
        }
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        return {
            winner: sortedPlayers[0] || { nickname: "", score: 0 },
            dumbest: sortedPlayers.length > 1 ? sortedPlayers[sortedPlayers.length - 1] : { nickname: "", score: 0 }
        };
    }

    startTimer(seconds, callback) {
        clearInterval(this.timerInterval);
        this.remainingTime = seconds;
        this.timerCallback = callback;

        this.io.emit('updateTimer', this.remainingTime);

        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;

            this.remainingTime--;
            this.io.emit('updateTimer', this.remainingTime);

            if (this.remainingTime <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                callback();
            }
        }, 1000);
    }

    pauseGame() {
        this.isPaused = !this.isPaused;
        this.io.emit('gamePaused', this.isPaused);
    }

    handleAnswer(playerId, questionId, answerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player && this.gameState === 'QUESTION') {
            const currentQuestion = this.questions[this.currentQuestionIndex];
            player.answers[questionId] = {
                answerId,
                timestamp: Date.now()
            };
            this.notifyPlayers();
        }
    }

    useAbility(playerId, abilityType, targetPlayerId = null) {
        const player = this.players.find(p => p.id === playerId);
        const abilityIndex = player.abilities.findIndex(a => a.type === abilityType);

        if (abilityIndex === -1) throw new Error("Способность не существует");
        if (!player) return;

        if (this.gameState !== 'QUESTION' || this.isPaused) {
            this.io.to(player.socketId).emit('systemMessage', "Способность можно использовать только во время активного вопроса");
            setTimeout(() => {
                this.io.emit('clearSystemMessage');
            }, 7000);
        }

        player.abilities.splice(abilityIndex, 1);
        this.notifyPlayers();

        const currentQuestion = this.questions[this.currentQuestionIndex];

        const targetPlayer = targetPlayerId ? this.players.find(p => p.id === targetPlayerId) : null;

        switch(abilityType) {
            case 'steal':
                if (targetPlayer) {
                    if (targetPlayer.score >= 50) {
                        player.score += 50;
                        targetPlayer.score -= 50;
                        this.sendSystemMessage(`Кто-то украл очки у ${targetPlayer.nickname}!`);
                    } else {
                        player.score += 50;
                        this.sendSystemMessage(`Кто-то совершенно случайно нашел пару монет у себя в кармане!`);
                    }
                    this.notifyPlayers();
                }
                break;

            case 'right':
                this.io.to(player.socketId).emit('showCorrectAnswer', currentQuestion.correctAnswerId);
                this.sendSystemMessage("Кто-то подсмотрел правильный ответ");
                break;

            case 'trick':
                if (targetPlayer) {
                    const wrongAnswers = currentQuestion.answers.filter(a => a.id !== currentQuestion.correctAnswerId);
                    const randomAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];

                    targetPlayer.answers[currentQuestion.id] = {
                        answerId: randomAnswer.id,
                        timestamp: Date.now()
                    };
                    this.sendSystemMessage(`Кто-то подменил ответ у ${targetPlayer.nickname}!`);
                }
                break;

            case 'help':
                if (targetPlayer) {
                    const targetAnswer = targetPlayer.answers[currentQuestion.id];
                    if (targetAnswer) {
                        this.io.to(playerId).emit('showPlayerAnswer', {
                            playerId: targetPlayerId,
                            answerId: targetAnswer.answerId
                        });
                        this.sendSystemMessage(`Кто-то подсмотрел ответ у ${targetPlayer.nickname}!`);
                    }
                }
                break;

            default: {}
        }
    }

    sendSystemMessage(text) {
        this.io.emit('systemMessage', text);

        setTimeout(() => {
            this.io.emit('clearSystemMessage');
        }, 7000);
    }

    restorePlayer(playerId, socketId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.socketId = socketId;
            player.connected = true;

            if (this.gameState === 'COUNTDOWN') {
                this.io.to(socketId).emit('lobbyPaused', this.isLobbyPaused);
                if (this.isLobbyPaused) {
                    this.io.to(socketId).emit('updateCountdown', this.countdownTime);
                }
            }

            if (this.gameState === 'QUESTION') {
                this.io.to(socketId).emit('gamePaused', this.isPaused);
            }

            this.notifyPlayers();
            return player;
        }
        return null;
    }
}