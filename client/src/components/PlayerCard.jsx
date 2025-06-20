import React from 'react';

const PlayerCard = ({ player, isHost, onKick }) => {
    return (
        <div className={`member card ${player.isHost ? 'host' : ''}`}>
            <img
                className="member-photo"
                src={player.avatarUrl || '/img/no-image-avatar.png'}
                alt={player.nickname}
            />

            {isHost && !player.isHost ? (
                <div className="member-nickname">
                    <p className="member-name with-button">{player.nickname}</p>
                    <button
                        className="kick-but"
                        title="Выгнать"
                        onClick={() => onKick(player.id)}
                    ></button>
                </div>
            ) : (
              <p className="member-name">{player.nickname}</p>
            )}

            <div className="member-score">{player.score || 0}</div>
        </div>
    );
};

export default PlayerCard;