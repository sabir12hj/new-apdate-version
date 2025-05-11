import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Keeps track of quiz state
interface QuizState {
  status: "loading" | "ready" | "question" | "completed" | "error";
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  timeLeft: number;
  score: number;
  userResponses: Array<{
    questionId: number;
    answerIndex: number;
    timeTaken: number;
  }>;
  results: {
    score: number;
    totalQuestions: number;
    timeTaken: number;
  } | null;
}

const Quiz = () => {
  const { id } = useParams();
  const tournamentId = parseInt(id);
  const [, navigate] = useLocation();
  const { user, requireAuth } = useAuth();
  const { toast } = useToast();

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>({
    status: "loading",
    currentQuestionIndex: 0,
    selectedAnswer: null,
    timeLeft: 0,
    score: 0,
    userResponses: [],
    results: null,
  });

  // Make sure user is authenticated
  useEffect(() => {
    requireAuth(`/login?redirectTo=/tournaments/${tournamentId}/quiz`);
  }, [requireAuth, tournamentId]);

  // Fetch quiz data
  const { data: quizData, isLoading: isLoadingQuiz, error: quizError } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/start-quiz`],
    staleTime: 0, // Always fetch fresh data
    retry: false,
    enabled: !!user,
  });

  // Set up timer
  useEffect(() => {
    if (quizState.status !== "question" || quizState.timeLeft <= 0) return;

    const timer = setInterval(() => {
      setQuizState((prev) => ({
        ...prev,
        timeLeft: prev.timeLeft - 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.status, quizState.timeLeft]);

  // Auto-submit answer when timer reaches 0
  useEffect(() => {
    if (quizState.status === "question" && quizState.timeLeft === 0) {
      submitAnswer();
    }
  }, [quizState.timeLeft]);

  // Handle quiz data loading
  useEffect(() => {
    if (isLoadingQuiz) {
      setQuizState((prev) => ({ ...prev, status: "loading" }));
      return;
    }

    if (quizError) {
      setQuizState((prev) => ({ ...prev, status: "error" }));
      return;
    }

    if (quizData) {
      // Set initial question and timer
      if (quizData.questions && quizData.questions.length > 0) {
        setQuizState((prev) => ({
          ...prev,
          status: "ready",
          timeLeft: quizData.questions[0].timer,
        }));
      } else {
        setQuizState((prev) => ({ ...prev, status: "error" }));
      }
    }
  }, [quizData, isLoadingQuiz, quizError]);

  // Start the quiz
  const startQuiz = () => {
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      setQuizState((prev) => ({ ...prev, status: "error" }));
      return;
    }

    setQuizState((prev) => ({
      ...prev,
      status: "question",
      currentQuestionIndex: 0,
      selectedAnswer: null,
      timeLeft: quizData.questions[0].timer,
      score: 0,
      userResponses: [],
    }));
  };

  // Submit answer
  const submitAnswer = async () => {
    if (
      quizState.status !== "question" ||
      !quizData ||
      !quizData.questions ||
      quizState.currentQuestionIndex >= quizData.questions.length
    ) {
      return;
    }

    const currentQuestion = quizData.questions[quizState.currentQuestionIndex];
    const answerIndex = quizState.selectedAnswer !== null ? quizState.selectedAnswer : -1; // -1 for no answer
    const timeTaken = currentQuestion.timer - quizState.timeLeft;

    try {
      // Record the user's response
      setQuizState((prev) => ({
        ...prev,
        userResponses: [
          ...prev.userResponses,
          {
            questionId: currentQuestion.id,
            answerIndex: answerIndex,
            timeTaken: timeTaken,
          },
        ],
      }));

      // Submit answer to the server if one was selected
      if (answerIndex !== -1) {
        const response = await apiRequest("POST", `/api/tournaments/${tournamentId}/submit-answer`, {
          questionId: currentQuestion.id,
          answerIndex: answerIndex,
          timeTaken: timeTaken,
        });
      }

      // Move to the next question or finish the quiz
      if (quizState.currentQuestionIndex < quizData.questions.length - 1) {
        const nextQuestion = quizData.questions[quizState.currentQuestionIndex + 1];
        setQuizState((prev) => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedAnswer: null,
          timeLeft: nextQuestion.timer,
        }));
      } else {
        // Finish the quiz
        finishQuiz();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred while submitting your answer",
        variant: "destructive",
      });
    }
  };

  // Finish the quiz
  const finishQuiz = async () => {
    try {
      const response = await apiRequest("POST", `/api/tournaments/${tournamentId}/finish-quiz`, {});
      const data = await response.json();

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });

      setQuizState((prev) => ({
        ...prev,
        status: "completed",
        results: data,
      }));

      toast({
        title: "Quiz Completed",
        description: `You've answered ${data.score} out of ${data.totalQuestions} questions correctly.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred while finishing the quiz",
        variant: "destructive",
      });
      setQuizState((prev) => ({ ...prev, status: "error" }));
    }
  };

  // Select an answer
  const selectAnswer = (index: number) => {
    if (quizState.status !== "question") return;

    setQuizState((prev) => ({
      ...prev,
      selectedAnswer: index,
    }));
  };

  // Calculate progress
  const calculateProgress = () => {
    if (
      quizState.status !== "question" ||
      !quizData ||
      !quizData.questions ||
      quizData.questions.length === 0
    ) {
      return 0;
    }

    return ((quizState.currentQuestionIndex + 1) / quizData.questions.length) * 100;
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render quiz content based on state
  const renderQuizContent = () => {
    switch (quizState.status) {
      case "loading":
        return (
          <div className="text-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading quiz...</p>
          </div>
        );

      case "ready":
        return (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Ready to Start</h2>
            <p className="mb-8">
              This quiz has {quizData?.totalQuestions} questions. Each question has a time limit.
              <br />
              You cannot go back or skip questions.
            </p>
            <Button size="lg" onClick={startQuiz}>
              Start Quiz
            </Button>
          </div>
        );

      case "question":
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          return (
            <div className="text-center py-10">
              <AlertCircle className="h-10 w-10 text-error mx-auto mb-4" />
              <p>No questions found for this quiz.</p>
            </div>
          );
        }

        const currentQuestion = quizData.questions[quizState.currentQuestionIndex];
        return (
          <div className="p-6">
            <div className="mb-8">
              <div className="flex justify-end mb-2">
                <div className="bg-error/10 text-error px-3 py-1 rounded-full font-accent font-bold flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>{formatTime(quizState.timeLeft)}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">{currentQuestion.question}</h3>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`border border-gray-200 rounded-lg p-4 hover:bg-neutral cursor-pointer transition-colors ${
                    quizState.selectedAnswer === index ? "bg-neutral border-primary" : ""
                  }`}
                  onClick={() => selectAnswer(index)}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="answer"
                      className="h-5 w-5 text-primary"
                      checked={quizState.selectedAnswer === index}
                      onChange={() => selectAnswer(index)}
                    />
                    <span className="ml-3">{option}</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Next question will appear automatically when the timer ends
              </p>
              <Button onClick={submitAnswer} disabled={quizState.selectedAnswer === null}>
                Submit Answer
              </Button>
            </div>
          </div>
        );

      case "completed":
        return (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
            {quizState.results ? (
              <div className="mb-6">
                <p className="mb-2">
                  You've answered{" "}
                  <span className="font-bold text-primary">
                    {quizState.results.score} out of {quizState.results.totalQuestions}
                  </span>{" "}
                  questions correctly.
                </p>
                <p className="text-gray-600">
                  Total time: {formatTime(quizState.results.timeTaken)}
                </p>
              </div>
            ) : (
              <p className="mb-6">Your submission has been recorded.</p>
            )}
            <p className="mb-8 text-gray-600">
              Check the tournament page later to see the final results and leaderboard.
            </p>
            <Button onClick={() => navigate(`/tournaments/${tournamentId}`)}>
              Back to Tournament
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-10">
            <AlertCircle className="h-10 w-10 text-error mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Quiz</h2>
            <p className="mb-6">
              {quizError instanceof Error
                ? quizError.message
                : "There was an error loading the quiz. Please try again later."}
            </p>
            <Button onClick={() => navigate(`/tournaments/${tournamentId}`)}>
              Back to Tournament
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <div className="bg-secondary p-4 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">
              {quizData?.quiz?.title || "Quiz Tournament"}
            </h2>
            {quizState.status === "question" && quizData && quizData.questions && (
              <div className="text-white font-accent font-bold text-xl">
                Q <span>{quizState.currentQuestionIndex + 1}</span>/
                <span>{quizData.questions.length}</span>
              </div>
            )}
          </div>
          <div className="mt-2 w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <CardContent className="p-0">{renderQuizContent()}</CardContent>
      </Card>
    </div>
  );
};

export default Quiz;
