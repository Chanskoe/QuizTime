import React from 'react';
import { useGame } from '../contexts/GameContext';

const Question = () => {
    const { currentQuestion, timer, answerQuestion } = useGame();
    const [correctAnswer, setCorrectAnswer] = useState(null);

    if (!currentQuestion) return null;

    useEffect(() => {
      const handleCorrectAnswer = (answerId) => {
        setCorrectAnswer(answerId);
        setTimeout(() => setCorrectAnswer(null), 5000);
      };

      socket.on('showCorrectAnswer', handleCorrectAnswer);
      return () => socket.off('showCorrectAnswer', handleCorrectAnswer);
    }, [socket]);

    const renderAnswers = () => {
        if (currentQuestion.type === 'text') {
            return currentQuestion.answers.map(answer => (
                <button
                    key={answer.id}
                    className="answer answer-text"
                    onClick={() => answerQuestion(answer.id)}
                >
                <p className="text">{answer.text}</p>
                </button>
            ));
        } else {
            return currentQuestion.answers.map(answer => (
                <button
                    key={answer.id}
                    className="answer answer-photo"
                    style={{ backgroundImage: `url(${answer.imageUrl})` }}
                    onClick={() => answerQuestion(answer.id)}
                >
                <div className="check-mark-back">
                    <div className="check-mark"></div>
                </div>
                </button>
            ));
        }
    };

    return (
        <article className="quiz">
            <div className="question">
                <p className="timer cute-font">{timer}</p>
                <div className="2nd-part-question">
                    <p className="question-words">{currentQuestion.text}</p>
                </div>
            </div>
            <div className={`answers-${currentQuestion.type === 'text' ? 'text' : 'photos'}`}>
                {renderAnswers()}
            </div>
        </article>
    );
};

export default Question;