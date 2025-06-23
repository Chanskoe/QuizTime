import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import PlayerCard from './PlayerCard';
import Chat from './Chat';
import Options from './Options';

const QuestionScreen = () => {
    const { socket, quizName, isPaused, currentQuestion, timer, answerQuestion, players, currentPlayer,
        abilities, useAbility, endGame, kickPlayer, gameState, questionNumber } = useGame();
    const [selectedAnswerId, setSelectedAnswerId] = useState(null);
    const [correctAnswerId, setCorrectAnswerId] = useState(null);
    const [selectedAbility, setSelectedAbility] = useState(null);
    const [inviteLink, setInviteLink] = useState('');
    const [formattedTime, setFormattedTime] = useState('0:00');
    const [classTimer, setClassTimer] = useState('start-timer cute-font');

    useEffect(() => {
        setInviteLink(window.location.href);
    }, []);

    useEffect(() => {
        setClassTimer(timer <= 5 ? "timer cute-font red-timer" : "timer cute-font");
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        setFormattedTime(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }, [timer]);

    useEffect(() => {
        const handleShowCorrect = (correctId) => {
            setCorrectAnswerId(correctId);
            setTimeout(() => setCorrectAnswerId(null), 5000);
        };

        socket.on('showCorrectAnswer', handleShowCorrect);

        return () => {
            socket.off('showCorrectAnswer', handleShowCorrect);
        };
    }, [socket]);

    useEffect(() => {
        setSelectedAnswerId(null);
        setCorrectAnswerId(null);
    }, [currentQuestion]);

    useEffect(() => {
        if (!socket) return;

        const handleShowAnswers = (correctId) => {
            setCorrectAnswerId(correctId);
        };

        socket.on('showAnswers', handleShowAnswers);

        return () => {
            socket.off('showAnswers', handleShowAnswers);
        };
    }, [socket]);

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Ссылка скопирована в буфер обмена');
    };

    const handleAnswer = (answerId) => {
        if (!correctAnswerId) {
            setSelectedAnswerId(answerId);
            answerQuestion(answerId);
        }
    };

    const getAnswerClass = (answer) => {
        const colours = {
            1: "yellow",
            2: "green",
            3: "orange",
            4: "blue"
        };

        let baseClass = currentQuestion.type === 'text'
            ? 'answer answer-text'
            : 'answer answer-photo';

        baseClass += ` ${colours[answer.id]}`;

        if (selectedAnswerId === answer.id) {
            baseClass += ' selected-answer';
        }

        if (correctAnswerId) {
            if (answer.id === correctAnswerId) {
                return `${baseClass} correct`;
            } else {
                return `${baseClass} wrong`;
            }
        }

        return baseClass;
    };

    const handleAbilityClick = (ability) => {
        if (!ability.canUse) return;

        if (selectedAbility?.type === ability.type) {
            let targetId = null;

            if (ability.type === 'trick' || ability.type === 'help') {
                const otherPlayers = players.filter(p => p.id !== currentPlayer.id);
                if (otherPlayers.length > 0) {
                    const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                    targetId = randomPlayer.id;
                } else return;
            }

            useAbility(ability.type, targetId);
            setSelectedAbility(null);
        } else {
            setSelectedAbility(ability);
        }
    };

    const handleKickPlayer = (playerId) => {
        if (playerId !== currentPlayer.id) {
            kickPlayer(playerId);
        }
    };

    const questionType = currentQuestion?.type || 'text';
    const questionText = currentQuestion?.text || '';
    const questionAnswers = currentQuestion?.answers || [];
    const questionId = currentQuestion?.id;

    const canAnswer = !currentQuestion?.targetPlayerId ||
        currentQuestion.targetPlayerId === currentPlayer?.id;

    return (
        <>
            <section className="quiz-card card">
                <p className="quiz-name">{quizName}</p>
                <div className="line"></div>

                <div className="grid-quiz">
                    <article className="quiz">
                        <div className="question">
                            <p className={classTimer}>{formattedTime}</p>
                            <div className="2nd-part-question">
                                <p className="question-words">{(currentQuestion?.text) ? currentQuestion?.text : ''}</p>
                            </div>
                        </div>

                        <div className={`answers-${questionType === 'text' ? 'text' : 'photos'}`}>
                            {questionAnswers.map( (answer) => (
                                <button
                                    key={answer.id}
                                    className={getAnswerClass(answer)}
                                    onClick={() => canAnswer && handleAnswer(answer.id)}
                                    disabled={!!correctAnswerId || !canAnswer}
                                    style={questionType !== 'text'
                                        ? { backgroundImage: `url(${answer.imageUrl})` }
                                        : {}
                                    }
                                >
                                    {questionType === 'text' ?
                                    (
                                        <>
                                            <p className="text">{answer.text}</p>
                                            <div className="check-mark"></div>
                                        </>
                                    ) : (
                                        <div className="check-mark-back">
                                            <div className="check-mark"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </article>

                    <div className="line-sm-xs"></div>

                    <Chat />
                </div>
            </section>

            <section className="members-card">
                {players.map(player => (
                    <PlayerCard key={player.id} player={player} />
                ))}
            </section>

            <div className="flex-options-perks">
                <section className="perks-card card">
                    <p className="abilities">Способности</p>
                    <div className="perks">
                        <div className="perks-scroll">
                            {abilities.map((ability, index) => (
                                <button
                                    key={index}
                                    className={`perk ${ability.type} ${selectedAbility?.type === ability.type ? 'selected-perk' : ''}`}
                                    onClick={() => handleAbilityClick(ability)}
                                    disabled={!ability.canUse}
                                    title={ability.description}
                                ></button>
                            ))}
                        </div>
                    </div>
                    <p className="perk-description">
                        {selectedAbility
                            ? selectedAbility.description
                            : abilities.length > 0
                                ? 'Здесь представлены Ваши способности. Используйте их, чтобы выиграть.'
                                : 'Все способности использованы.'}
                    </p>
                </section>

                <Options />
            </div>
        </>
    );
};

export default QuestionScreen;