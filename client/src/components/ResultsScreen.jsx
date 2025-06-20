import React from 'react';
import { useGame } from '../contexts/GameContext';
import Chat from './Chat';
import PlayerCard from './PlayerCard';

const ResultsScreen = () => {
    const { quizName, gameResults, players } = useGame();

    if (!gameResults) {
        return (
            <section className="quiz-card card">
                <p className="quiz-name">{quizName}</p>
                <div className="line"></div>
                <div className="loading">Конец игры</div>
            </section>
        );
    }

    return (
        <>
            <section className="quiz-card card">
                <p className="quiz-name">Докажи, что я твой лучший друг</p>
                <div className="line"></div>

                <div className="grid-quiz">
                    <article className="quiz">
                        <div className="start">
                            <div className="start-title">
                                <h2 className="title">Игра закончена</h2>
                            </div>
                            <div className="start-info">
                                { gameResults.dumbest &&
                                    (<p className="quiz-description">Самый глупый участник: <span className="weight-medium">{gameResults.dumbest.nickname}</span></p>)
                                }
                                { gameResults.smartest &&
                                    (<p className="quiz-description">Самый хитрый участник: <span className="weight-medium">{gameResults.smartest.nickname}</span></p>)
                                }
                                <p className="quiz-description">Победитель: <span className="weight-medium">{gameResults.winner.nickname}</span></p>
                            </div>
                        </div>
                    </article>

                    <div className="line-sm-xs"></div>

                    < Chat />
                </div>
            </section>

            <section className="members-card result">
                {players.map(player => (
                    <PlayerCard key={player.id} player={player} />
                ))}
            </section>
        </>);
};

export default ResultsScreen;