import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function LearningModules() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  
  const lessons = useQuery(api.lessons.getLessonsByCategory, { category: selectedCategory });
  const categories = useQuery(api.lessons.getLessonCategories);
  const initializeLessons = useMutation(api.lessons.initializeLessons);

  useEffect(() => {
    initializeLessons();
  }, [initializeLessons]);

  const categoryIcons: Record<string, string> = {
    basics: "📚",
    savings: "💎",
    interest: "📊",
    loans: "🏦",
    credit: "💳",
    investment: "📈",
    budgeting: "✅",
  };

  if (!lessons || !categories) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Learning Modules</h2>
        <div className="text-sm text-gray-600">
          {lessons.filter(l => l.isCompleted).length} of {lessons.length} completed
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            !selectedCategory
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === category.name
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{categoryIcons[category.name] || "📖"}</span>
            <span className="capitalize">{category.name}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson._id}
            lesson={lesson}
            onSelect={() => setSelectedLesson(lesson)}
          />
        ))}
      </div>

      {/* Lesson Modal */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          onClose={() => {
            setSelectedLesson(null);
            setShowQuiz(false);
            setQuizStarted(false);
          }}
          showQuiz={showQuiz}
          quizStarted={quizStarted}
          onStartQuiz={() => {
            setShowQuiz(true);
            setQuizStarted(true);
          }}
        />
      )}
    </div>
  );
}

function LessonCard({ lesson, onSelect }: { lesson: any; onSelect: () => void }) {
  const difficultyColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
         onClick={onSelect}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            difficultyColors[lesson.difficulty as keyof typeof difficultyColors]
          }`}>
            {lesson.difficulty}
          </span>
          {lesson.isCompleted && (
            <span className="text-green-500 text-sm">✅</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-yellow-600">
          <span>🪙</span>
          <span className="text-sm font-medium">{lesson.coinReward}</span>
        </div>
      </div>
      
      <h3 className="font-semibold text-lg mb-2">{lesson.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{lesson.description}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>⏱️ {lesson.estimatedTime} min</span>
        <span className="capitalize">{lesson.category}</span>
      </div>
    </div>
  );
}

function LessonModal({ lesson, onClose, showQuiz, quizStarted, onStartQuiz }: {
  lesson: any;
  onClose: () => void;
  showQuiz: boolean;
  quizStarted: boolean;
  onStartQuiz: () => void;
}) {
  const quizQuestions = useQuery(api.lessons.getQuizQuestions, { lessonId: lesson._id });
  const submitQuiz = useMutation(api.lessons.submitQuizAttempt);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quizQuestions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizQuestions) return;
    
    const score = answers.reduce((total, answer, index) => {
      return total + (answer === quizQuestions[index].correctAnswer ? 1 : 0);
    }, 0);

    try {
      const result = await submitQuiz({
        lessonId: lesson._id,
        score,
        totalQuestions: quizQuestions.length,
        timeSpent: 300, // 5 minutes estimated
      });
      
      setQuizResult(result);
      setQuizCompleted(true);
      
      if (result.passed) {
        toast.success(`Quiz completed! ${result.coinsEarned > 0 ? `Earned ${result.coinsEarned} coins!` : ''}`);
      } else {
        toast.error("Quiz failed. Try again to improve your score!");
      }
    } catch (error) {
      toast.error("Failed to submit quiz");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-green-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{lesson.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!showQuiz ? (
            <>
              <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">📖 Lesson Content</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-base">{lesson.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 bg-blue-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lesson.estimatedTime}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center border-l border-r border-blue-200">
                  <div className="text-2xl font-bold text-yellow-600">🪙 {lesson.coinReward}</div>
                  <div className="text-sm text-gray-600">Coins</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600 capitalize">{lesson.difficulty}</div>
                  <div className="text-sm text-gray-600">Difficulty</div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">💡 Tip:</span> Complete this lesson and score 70% or higher on the quiz to earn coins and unlock badges!
                </p>
              </div>

              <button
                onClick={onStartQuiz}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg text-lg"
              >
                🚀 Start Quiz Now
              </button>
            </>
          ) : quizCompleted ? (
            <QuizResult result={quizResult} onClose={onClose} />
          ) : quizStarted ? (
            quizQuestions === undefined ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No quiz questions available for this lesson.</p>
                <button
                  onClick={onClose}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <Quiz
                questions={quizQuestions}
                currentQuestion={currentQuestion}
                answers={answers}
                onAnswerSelect={handleAnswerSelect}
                onNext={handleNextQuestion}
              />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Quiz({ questions, currentQuestion, answers, onAnswerSelect, onNext }: {
  questions: any[];
  currentQuestion: number;
  answers: number[];
  onAnswerSelect: (index: number) => void;
  onNext: () => void;
}) {
  if (!questions || questions.length === 0) {
    return <div className="text-center text-gray-600 py-12">No questions available</div>;
  }

  const question = questions[currentQuestion];
  if (!question) {
    return <div className="text-center text-gray-600 py-12">Question not found</div>;
  }

  const isLastQuestion = currentQuestion === questions.length - 1;
  const selectedAnswer = answers[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          {/* eslint-disable-next-line */}
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` } as React.CSSProperties}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{question.question}</h3>
        {question.explanation && (
          <p className="text-sm text-gray-600 mt-2">💡 Tip: {question.explanation.substring(0, 100)}...</p>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Select your answer:</p>
        {question.options.map((option: string, index: number) => {
          const isSelected = selectedAnswer === index;
          return (
            <button
              key={index}
              onClick={() => onAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all transform hover:scale-102 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-semibold transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-400 bg-white text-gray-400"
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`text-base ${isSelected ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {currentQuestion > 0 && (
          <button
            onClick={() => {
              // Previous button functionality could be added here
            }}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            disabled
          >
            ← Previous (Coming Soon)
          </button>
        )}
        <button
          onClick={onNext}
          disabled={selectedAnswer === undefined}
          className={`flex-1 font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-105 ${
            selectedAnswer === undefined
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg"
          }`}
        >
          {isLastQuestion ? "✓ Submit Quiz" : "Next Question →"}
        </button>
      </div>

      {/* Selected Answer Feedback */}
      {selectedAnswer !== undefined && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Your answer:</span> {question.options[selectedAnswer]}
          </p>
        </div>
      )}
    </div>
  );
}

function QuizResult({ result, onClose }: { result: any; onClose: () => void }) {
  return (
    <div className="text-center space-y-4">
      <div className={`text-6xl ${result.passed ? "text-green-500" : "text-red-500"}`}>
        {result.passed ? "🎉" : "😔"}
      </div>
      
      <h3 className="text-xl font-bold">
        {result.passed ? "Congratulations!" : "Keep Learning!"}
      </h3>
      
      <p className="text-gray-600">
        {result.passed 
          ? "You've successfully completed this lesson!"
          : "Don't worry, you can try again to improve your score."
        }
      </p>

      {result.coinsEarned > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="font-semibold text-yellow-700">
              +{result.coinsEarned} coins earned!
            </span>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        Continue Learning
      </button>
    </div>
  );
}
