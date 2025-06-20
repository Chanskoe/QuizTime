import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import SystemMessage from './SystemMessage';

const Chat = () => {
    const { messages, sendMessage, gameState, currentPlayer, questionNumber } = useGame();
    const [message, setMessage] = useState('');

    const current = questionNumber?.current || 0;
    const total = questionNumber?.total || 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            sendMessage(message);
            setMessage('');
        }
    };

     const input = (!currentPlayer)
        ? ''
        : (
            <form className="write-message" onSubmit={handleSubmit}>
                <input
                    placeholder="Написать сообщение..."
                    className="in-put"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    autoComplete="off"
                    inputMode="text"
                />
                <span className="meow">
                    <button
                        className="meow-meow"
                        type="submit"
                    >
                        <span className="circle cute-font">></span>
                    </button>
                </span>
            </form>)

    return (
        <aside className="chat-and-info">
            <div className="quiz-info">
                <div className="numbering">
                    {gameState === 'QUESTION' && total > 0
                        ? `${current}/${total}`
                        : ''}
                </div>
                <div className="system-messages">
                    <SystemMessage />
                </div>
            </div>
            <div className="chat">
                <div className="chat-scroll">
                    <div className="messages">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.isCurrentUser ? 'your-message' : ''}`}
                            >
                                <p>
                                    <span className="username">{msg.nickname}: </span>
                                    {msg.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                {input}
            </div>
        </aside>
    );
};

export default Chat;