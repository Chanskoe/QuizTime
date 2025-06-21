import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const [socket] = useState(() => io('http://localhost:3000',
        { withCredentials: true, autoConnect: true,
            reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000
        }));
    const [gameState, setGameState] = useState('LOBBY');
    const [quizName, setQuizName] = useState('Викторина');
    const [isLobbyPaused, setIsLobbyPaused] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [players, setPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [countdownTime, setCountdownTime] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [timer, setTimer] = useState(0);
    const [messages, setMessages] = useState([]);
    const [abilities, setAbilities] = useState([]);
    const [gameResults, setGameResults] = useState(null);
    const [joinGameError, setJoinGameError] = useState(null);
    const [questionNumber, setQuestionNumber] = useState({ current: 0, total: 0 });

    useEffect(() => {
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];

        if (token) {
            socket.auth = { token };
            socket.connect();

            socket.on('sessionRestored', (data) => {
                if (data.isKicked) {
                    alert('Вы исключены из игры на 1 минуту');
                    return;
                }

                setGameState(data.gameState);
                setQuizName(data.quizName);
                setCurrentPlayer({
                    id: data.id,
                    nickname: data.nickname,
                    avatarUrl: data.avatarUrl,
                    isHost: data.isHost,
                    score: data.score});
                setAbilities(data.abilities);
                setCurrentQuestion(data.currentQuestion);
                setTimer(data.remainingTime);
                setQuestionNumber({
                    current: data.displayedQuestionNumber,
                    total: data.totalQuestions
                });
                setCurrentQuestion(data.currentQuestion);
                setIsLobbyPaused(data.isLobbyPaused || false);
                setIsPaused(data.isPaused || false);
                if (data.gameResults) {
                    setGameResults(data.gameResults);
                }
            });
        }

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        socket.on('invalidateToken', () => {
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        });

        socket.on('updatePlayers', (playersData) => {
            setPlayers(playersData);

            if (currentPlayer) {
                const updatedPlayer = playersData.find(p => p.id === currentPlayer.id);
                if (updatedPlayer) {
                    setCurrentPlayer(updatedPlayer);
                    setAbilities(updatedPlayer.abilities || []);
                }
            }
        });

        socket.on('gameStateChange', (state) => {
            setGameState(state);
        });

        socket.on('chatHistory', (history) => {
            setMessages(history || []);
        });

        socket.on('newMessage', (msg) => {
            setMessages(prev => [...prev, {
                ...msg,
                isCurrentUser: msg.playerId === currentPlayer?.id
            }]);
        });

        socket.emit('requestChatHistory');

        socket.on('lobbyPaused', (paused) => {
            setIsLobbyPaused(paused);
        });

        socket.on('gamePaused', (paused) => {
            setIsPaused(paused);
        });

        socket.on('updateCountdown', (time) => {
            setCountdownTime(time);
        });

        socket.on('updateQuestion', (question) => {
            setCurrentQuestion(question);
        });

        socket.on('updateTimer', (time) => {
            setTimer(time);
        });

        socket.on('abilityUsed', ({ abilityType }) => {
            setAbilities(prev => prev.filter(a => a.type !== abilityType));
        });

        socket.on('updateAbilities', (playerAbilities) => {
            if (currentPlayer && playerAbilities.playerId === currentPlayer.id) {
                setAbilities(playerAbilities.abilities);
            }
        });

        socket.on('showCorrectAnswer', (correctAnswerId) => {
            console.log("Правильный ответ:", correctAnswerId);
        });

        socket.on('showPlayerAnswer', ({ playerId, answerId }) => {
            console.log(`Игрок ${playerId} ответил: ${answerId}`);
        });

        socket.on('gameResults', (results) => {
            setGameResults(results);
        });

        socket.on('kicked', () => {
            setCurrentPlayer(null);
            setGameState('LOBBY');
            alert('Вы были исключены из игры');
        });

        socket.on('updateQuestionNumber', (data) => {
            setQuestionNumber(data);
        });

        socket.on('joinError', (error) => {
            setJoinGameError(error);
        });

        socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                socket.connect();
            }
        });

        return () => {
            socket.off('connect');
            socket.off('updatePlayers');
            socket.off('gameStateChange');
            socket.off('isPaused');
            socket.off('lobbyPaused');
            socket.off('updateQuestion');
            socket.off('updateTimer');
            socket.off('newMessage');
            socket.off('updateAbilities');
            socket.off('gameResults');
            socket.off('kicked');
            socket.off('joinError');
            socket.off('sessionRestored');
            socket.off('updateQuestionNumber');
        };
    }, [socket, currentPlayer]);

    const joinGame = (nickname, avatarUrl) => {
        socket.emit('join', { nickname, avatarUrl }, (response) => {
            if (response.error) {
                setJoinGameError(response.error);
            } else {
                const { token, isHost, playerId, quizName } = response;
                document.cookie = `token=${token}; path=/; max-age=3600; samesite=lax`;
                setQuizName(quizName);
                setCurrentPlayer({
                    id: playerId,
                    nickname,
                    avatarUrl,
                    isHost,
                    score: 0
                });
                setJoinGameError(null);
            }
        });
    };

    const startGame = () => socket.emit('startGame');

    const startCountdown = () => socket.emit('startCountdown');
    const cancelCountdown = () => socket.emit('cancelCountdown');

    const answerQuestion = (answerId) => {
        if (currentQuestion) {
            socket.emit('answer', {
                questionId: currentQuestion.id,
                answerId
            });
        }
    };

    const sendMessage = (text) => {
        if (!currentPlayer || !text.trim()) return;

        const newMessage = {
            playerId: currentPlayer.id,
            nickname: currentPlayer.nickname,
            text,
            timestamp: Date.now()
        };

        socket.emit('sendMessage', newMessage);
    };

    const toggleCountdownPause = () => socket.emit('toggleCountdownPause');

    const kickPlayer = (playerId) => socket.emit('kickPlayer', playerId);

    const pauseGame = () => socket.emit('pauseGame');

    const endGame = () => socket.emit('endGame');

    const useAbility = (abilityType, targetPlayerId = null) => {
        socket.emit('useAbility', {
            abilityType,
            targetPlayerId
        });
    };

    return (
        <GameContext.Provider value={{
            socket,
            players,
            currentPlayer,
            gameState,
            quizName,
            currentQuestion,
            timer,
            messages,
            abilities,
            gameResults,
            joinGameError,
            joinGame,
            startGame,
            startCountdown,
            cancelCountdown,
            toggleCountdownPause,
            countdownTime,
            answerQuestion,
            sendMessage,
            kickPlayer,
            pauseGame,
            isPaused,
            isLobbyPaused,
            endGame,
            useAbility,
            questionNumber
        }}>
            {children}
        </GameContext.Provider>
    );
};