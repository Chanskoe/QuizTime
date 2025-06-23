import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

const Options = () => {
    const { currentPlayer, countdownTime, isLobbyPaused, toggleCountdownPause, endGame } = useGame();
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        setInviteLink(window.location.href);
    }, []);

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Ссылка скопирована в буфер обмена');
    };

    return (
        <section className="options-card card">
            { currentPlayer.isHost ?
                (   <>
                    <button id="pause" className="option-button" onClick={() => toggleCountdownPause()}>
                        { isLobbyPaused ? "Продолжить игру" : "Приостановить игру" }
                    </button>

                    <div className="line"></div>

                    <button className="option-button" onClick={copyInviteLink}>
                        Скопировать ссылку-приглашение
                    </button>

                    <div className="line"></div>

                    <button className="option-button" onClick={() => endGame()}>
                        Закончить игру досрочно
                    </button>
                    </>
                ) :
                (
                    <button className="option-button" onClick={copyInviteLink}>
                        Скопировать ссылку-приглашение
                    </button>
                )
            }
        </section>
    )
}

export default Options;