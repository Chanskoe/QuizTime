import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import PlayerCard from './PlayerCard';
import Chat from './Chat';
import { cropImageToSquare } from '../utils/avatarUtils';

const Lobby = () => {
    const { quizName, players, currentPlayer, joinGame, startGame, gameState, isPaused, isLobbyPaused,
        countdownTime, startCountdown, cancelCountdown, abilities: contextAbilities,
        kickPlayer, pauseGame, endGame, useAbility, joinGameError } = useGame();
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formattedTime, setFormattedTime] = useState('0:00');
    const [classTimer, setClassTimer] = useState("start-timer cute-font");
    const [inviteLink, setInviteLink] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        setClassTimer(countdownTime <= 5 ? "start-timer cute-font red-timer" : "start-timer cute-font");
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;
        setFormattedTime(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }, [countdownTime]);

    useEffect(() => {
        setInviteLink(window.location.href);
    }, []);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const croppedAvatar = await cropImageToSquare(file);
            setAvatar(croppedAvatar);
            setAvatarPreview(URL.createObjectURL(croppedAvatar));
        } catch (error) {
            console.error('Ошибка обработки аватара:', error);
            alert('Ошибка обработки аватара');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!nickname.trim()) return;

        setIsLoading(true);
        if (avatar) {
            try {
                const formData = new FormData();
                formData.append('avatar', avatar);

                const response = await fetch('http://localhost:3000/upload-avatar', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) {
                    console.error('Ошибка загрузки аватара:');
                }

                const { avatarUrl } = await response.json();
                joinGame(nickname, avatarUrl);
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                alert('Ошибка регистрации');
            } finally {
                setIsLoading(false);
            }
        } else {
            const { avatarUrl } = { avatarUrl : "/img/no-image-avatar.png" };
            setIsLoading(false);
            joinGame(nickname, avatarUrl);
        }
    };

    const abilities = currentPlayer?.abilities || contextAbilities || [];

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Ссылка скопирована в буфер обмена');
    };

    const handleKickPlayer = (playerId) => {
        const playerToKick = players.find(p => p.id === playerId);
        if (playerToKick && window.confirm(`Выгнать игрока ${playerToKick.nickname}?`)) {
            kickPlayer(playerId);
        }
    };

    if (!currentPlayer) {
        return (
            <>
                <section className="quiz-card card">
                    <p className="quiz-name">{quizName}</p>
                    <div className="line"></div>

                    <div className="grid-quiz">
                        <article className="quiz">
                            <div className="start">
                                <div className="start-title">
                                    <h2 className="title">Присоединись к игре</h2>
                                </div>
                                    <div className="registration-form">
                                        <input
                                            type="text"
                                            placeholder="Введите Ваш ник..."
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="nick-input"
                                            maxLength={20}
                                        />

                                        <div className="avatar-upload">
                                            <button
                                                className="reg-but avatar-but"
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Загрузка...' : 'Выбрать аватарку'}
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                style={{ display: 'none' }}
                                                disabled={isLoading}
                                            />

                                            {avatarPreview && (
                                                <div className="avatar-container">
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Превью аватара"
                                                        className="avatar-preview"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="start-but reg-but"
                                            onClick={handleSubmit}
                                            disabled={isLoading || !nickname.trim()}
                                        >
                                            {isLoading ? 'Регистрация...' : 'Присоединиться'}
                                        </button>
                                    </div>
                                {joinGameError && <p className="error-message">{joinGameError}</p>}
                            </div>
                        </article>

                        <div className="line-sm-xs"></div>

                        <Chat />
                    </div>
                </section>

                <section className="members-card no-reg">
                    {players.map(player => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            isHost={currentPlayer?.isHost}
                            onKick={handleKickPlayer}
                        />
                    ))}
                </section>
            </>
        );
      }

    return (
        <>
            <section className="quiz-card card">
                <p className="quiz-name">{quizName}</p>
                <div className="line"></div>

                <div className="grid-quiz">
                    <article className="quiz">
                        <div className="start">
                            <div className="start-title">
                                {countdownTime > 0 ? (
                                    <>
                                        <h2 className="title">Игра начнется через:</h2>
                                        <p className={classTimer}>{formattedTime}</p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="title">Игра еще не началась</h2>
                                        <p className="start-timer cute-font"></p>
                                    </>
                                )}
                            </div>
                            <div className="start-info">
                                <p className="quiz-description">Игра создана для всех моих друзей. Здесь ничего сложного нет - достаточно просто хорошо меня знать ;)</p>
                                <p className="quiz-description">Очки можно получить, отвечая на вопросы и используя способности</p>
                                <p className="quiz-description">Всего вопросов <span className="weight-medium">24</span></p>
                                <p className="quiz-description">В начале игры каждый получает две случайные способности. Также способности выдаются за правильные ответы на некоторые вопросы</p>
                                <p className="quiz-description">Справа расположен чат, обязательно оставь там свое сообщение!</p>
                            </div>

                            {currentPlayer.isHost ? (
                                countdownTime > 0 ? (
                                    <button
                                        className="start-but"
                                        onClick={cancelCountdown}
                                    >
                                        Отменить
                                    </button>
                                    ) : (
                                        <>
                                            <button
                                                className="start-but mg-auto"
                                                onClick={startCountdown}
                                            >
                                                Начать игру
                                            </button>
                                            <button
                                                className="start-but"
                                                onClick={copyInviteLink}
                                            >
                                                Пригласить друзей
                                            </button>
                                        </>
                                    )
                                )
                            : (
                                <p className="waiting-host">Ожидаем начала игры от хоста...</p>
                            )}
                        </div>
                    </article>

                    <div className="line-sm-xs"></div>

                    <Chat />
                </div>
            </section>

            <section className="members-card">
                {players.map(player => (
                    <PlayerCard
                        key={player.id}
                        player={player}
                        isHost={currentPlayer.isHost}
                        onKick={handleKickPlayer}
                    />
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
                                    className={`perk ${ability.type}`}
                                    onClick={() => useAbility(ability.type)}
                                    title={ability.description}
                                    disabled={!ability.canUse}
                                ></button>
                            ))}
                        </div>
                    </div>
                    <p className="perk-description empty-perks">
                        {abilities.length > 0
                            ? "Здесь представлены Ваши способности. Используйте их, чтобы выиграть."
                            : "Здесь будут Ваши способности. Используйте их, чтобы выиграть."}
                    </p>
                </section>

                <section className="options-card card">
                    <button id="pause" className="option-button" onClick={pauseGame} disabled={!currentPlayer.isHost}>
                        { isLobbyPaused ? "Продолжить игру" : "Приостановить игру" }
                    </button>

                    <div className="line"></div>

                    <button className="option-button" onClick={copyInviteLink}>
                        Скопировать ссылку-приглашение
                    </button>

                    <div className="line"></div>

                    <button className="option-button" onClick={endGame} disabled={!currentPlayer.isHost}>
                        Закончить игру досрочно
                    </button>

                </section>
             </div>
        </>
    );
};

export default Lobby;