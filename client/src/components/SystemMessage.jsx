import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

const SystemMessage = () => {
    const { socket, gameState } = useGame();
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleSystemMessage = (msg) => {
            setMessage(msg);
            setIsVisible(true);

            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 7000);

            return () => clearTimeout(timer);
        };

        const handleClearMessage = () => {
            setIsVisible(false);
        };

        socket.on('systemMessage', handleSystemMessage);
        socket.on('clearSystemMessage', handleClearMessage);

        return () => {
            socket.off('systemMessage', handleSystemMessage);
            socket.off('clearSystemMessage', handleClearMessage);
        };
    }, [socket]);

    return (
        <div className="system-messages">
            {isVisible ? message : 'Чат'}
        </div>
    );
};

export default SystemMessage;