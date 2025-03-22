import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import _ from 'lodash';

const VocabularyApp = () => {
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [exerciseMode, setExerciseMode] = useState('normal'); // normal or review

  const loadData = async (data) => {
    const XLSX = await import('xlsx');

    // Parse the Excel file
    const workbook = XLSX.read(data, { type: 'binary' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Process the exercises (skip header)
    const exercisesData = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (row.length === 0) continue;

      let sentence = row[8]; // Question column
      if (sentence && sentence.includes('\r\n')) {
        sentence = sentence.split('\r\n')[1];
      }

      exercisesData.push({
        id: row[0],
        word: row[5], // Hidden Word column
        hint: row[7], // First Letters column
        sentence: sentence || row[4], // Use example if no sentence is found
        blankedWord: row[6],
        meaning: row[3],
        pronunciation: row[2]
      });
    }

    // Shuffle the exercises
    setExercises(_.shuffle(exercisesData));
    setCurrentExerciseIndex(0); // Reset to first exercise
    setLoading(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadData(e.target.result);
      };
      reader.readAsBinaryString(file);
    }
  };

  const currentExercise = exercises[currentExerciseIndex] || {};

  const checkAnswer = () => {
    const correctAnswer = currentExercise.word.toLowerCase().trim();
    const userInput = userAnswer.toLowerCase().trim();
    const isAnswerCorrect = correctAnswer === userInput;

    setIsCorrect(isAnswerCorrect);
    setFeedback(isAnswerCorrect 
      ? "Correct! 🎉" 
      : `Not quite. The correct answer is "${currentExercise.word}"`);

    setStats(prev => ({
      correct: prev.correct + (isAnswerCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const nextExercise = () => {
    // Only move to next exercise if there are more exercises
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      resetExerciseState();
    } else {
      // If it's the last exercise, set mode to review
      setExerciseMode('review');
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      resetExerciseState();
    }
  };

  const resetExerciseState = () => {
    setUserAnswer('');
    setFeedback('');
    setIsCorrect(null);
    setShowMeaning(false);
  };

  const restartExercises = () => {
    setExercises([]);
    setCurrentExerciseIndex(0);
    setStats({ correct: 0, total: 0 });
    setExerciseMode('normal');
    resetExerciseState();
    setLoading(true); // Reset loading state
  };

  const toggleMeaning = () => {
    setShowMeaning(!showMeaning);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      if (isCorrect === null) {
        checkAnswer();
      } else {
        nextExercise();
      }
    } else if (event.key === 'r' || event.key === 'R') {
      resetExerciseState(); // Reset current exercise state
      setUserAnswer(''); // Clear user answer
      setIsCorrect(null); // Reset answer check state
      setFeedback(''); // Clear feedback
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        nextExercise(); // Move to the next exercise
      } else if (event.key === 'ArrowLeft') {
        prevExercise(); // Move to the previous exercise
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentExerciseIndex]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent default tab behavior
        document.getElementById('answer-input').focus(); // Focus on the answer input
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">English Vocabulary Learning</h1>

      <div className="text-center mb-8">
        <label className="block">
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <div className="text-gray-600 font-medium">
                Upload Excel File (.xlsx, .xls)
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Click or drag and drop your vocabulary file
              </p>
            </div>
          </div>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl font-semibold">Loading exercises...</div>
        </div>
      ) : exerciseMode === 'review' ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Exercise Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg mb-4">
              Your score: <span className="font-bold">{stats.correct}</span> out of <span className="font-bold">{stats.total}</span> ({Math.round((stats.correct / stats.total) * 100)}%)
            </div>
            {stats.correct === stats.total ? (
              <div className="bg-green-100 text-green-800 p-4 rounded-md">
                Perfect score! You've mastered all the vocabulary words! 🎉
              </div>
            ) : (
              <div className="bg-blue-100 text-blue-800 p-4 rounded-md">
                Good job! Review the exercises again to improve your score.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <button
              onClick={restartExercises}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Start Again
            </button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-sm text-gray-500">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
              />
            </div>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Fill in the blank</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Hint: {currentExercise.hint}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">{currentExercise.sentence}</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Your answer:</label>
                <input
                  type="text"
                  id="answer-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isCorrect !== null}
                  className="w-full p-2 border rounded-md"
                  placeholder="Type your answer here..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userAnswer && isCorrect === null) {
                      checkAnswer();
                    }
                  }}
                />
              </div>
              
              {isCorrect !== null && (
                <div className={`p-4 rounded-md mb-6 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                    {feedback}
                  </p>
                </div>
              )}
              
              {showMeaning && (
                <div className="bg-gray-100 p-4 rounded-md mb-6">
                  <div className="mb-2">
                    <span className="font-semibold">Pronunciation:</span> {currentExercise.pronunciation}
                  </div>
                  <div>
                    <span className="font-semibold">Meaning:</span> {currentExercise.meaning}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <button
                  onClick={prevExercise}
                  disabled={currentExerciseIndex === 0}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={toggleMeaning}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  {showMeaning ? 'Hide Meaning' : 'Show Meaning'}
                </button>
                <button
                  onClick={() => resetExerciseState()} // Retry the current exercise
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                  Do This Question Again (R)
                </button>
              </div>
              <div className="flex gap-2">
                {isCorrect === null ? (
                  <button
                    onClick={checkAnswer}
                    disabled={!userAnswer}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={nextExercise}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Next Exercise
                  </button>
                )}
              </div>
            </CardFooter>
          </Card>

          <div className="mt-4 text-center text-sm text-gray-500">
            Score: {stats.correct}/{stats.total} ({stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%)
          </div>
        </>
      )}
    </div>
  );
};

export default VocabularyApp;