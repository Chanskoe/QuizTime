import React from 'react';
import { useGame } from './contexts/GameContext';
import Lobby from './components/Lobby';
import QuestionScreen from './components/QuestionScreen';
import ResultsScreen from './components/ResultsScreen';

function App() {
    const { gameState } = useGame();

    return (
    <>
        <header>
            <h1 className="barrio-regular header">QUIZ TIME</h1>
        </header>
        <main className="main">
            {gameState === 'LOBBY' && <Lobby />}
            {gameState === 'COUNTDOWN' && <Lobby />}
            {gameState === 'QUESTION' && <QuestionScreen />}
            {gameState === 'RESULTS' && <ResultsScreen />}
        </main>
        <footer>
            <div className="line"></div>
            <div className="grid-footer"></div>
        </footer>
    </>
    );
}

export default App;