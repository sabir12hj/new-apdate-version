import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, Trophy, Timer, Plus, Trash, AlertTriangle } from "lucide-react";

// Define form schema
const questionSchema = z.object({
  id: z.number().optional(),
  question: z.string().min(5, "Question must be at least 5 characters"),
  options: z.array(
    z.string().min(1, "Option cannot be empty")
  ).min(2, "At least 2 options are required"),
  correctAnswer: z.string().min(0, "Correct answer must be selected"),
  timer: z.string().min(1, "Timer must be selected"),
});

const quizSchema = z.object({
  id: z.number(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  questions: z.array(questionSchema).min(3, "At least 3 questions are required"),
});

type QuizFormValues = z.infer<typeof quizSchema>;

const EditQuiz = () => {
  const { id } = useParams();
  const tournamentId = parseInt(id);
  const { requireAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  
  // Make sure user is admin
  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);
  
  // Fetch tournament data
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}`],
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch quiz data
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/quiz`],
    staleTime: 30000, // 30 seconds
    enabled: !!tournamentId,
  });
  
  // Fetch questions data
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: [`/api/admin/quizzes/${quiz?.id}/questions`],
    staleTime: 30000, // 30 seconds
    enabled: !!quiz?.id,
  });
  
  // Initialize form
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      id: 0,
      title: "",
      questions: [],
    },
  });
  
  // Update form values when data is loaded
  useEffect(() => {
    if (quiz && questions) {
      form.reset({
        id: quiz.id,
        title: quiz.title,
        questions: questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer.toString(),
          timer: q.timer.toString(),
        })),
      });
    }
  }, [quiz, questions, form]);
  
  // Use field array for questions
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });
  
  // Submit handler
  const onSubmit: SubmitHandler<QuizFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Update quiz
      const quizData = {
        tournamentId,
        title: data.title,
      };
      
      await apiRequest("PUT", `/api/quizzes/${data.id}`, quizData);
      
      // Update or create questions
      for (const question of data.questions) {
        if (question.id) {
          // Update existing question
          const questionData = {
            quizId: data.id,
            question: question.question,
            options: question.options,
            correctAnswer: parseInt(question.correctAnswer),
            timer: parseInt(question.timer),
          };
          
          await apiRequest("PUT", `/api/questions/${question.id}`, questionData);
        } else {
          // Create new question
          const questionData = {
            quizId: data.id,
            question: question.question,
            options: question.options,
            correctAnswer: parseInt(question.correctAnswer),
            timer: parseInt(question.timer),
          };
          
          await apiRequest("POST", "/api/questions", questionData);
        }
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/quiz`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quizzes/${data.id}/questions`] });
      
      toast({
        title: "Quiz Updated",
        description: "The quiz has been updated successfully.",
      });
      
      navigate(`/admin/tournaments/${tournamentId}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update quiz",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add new question
  const addQuestion = () => {
    append({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "0",
      timer: "15",
    });
  };
  
  // Delete question handler
  const handleDeleteQuestion = async () => {
    if (questionToDelete === null) return;
    
    try {
      const questionId = form.getValues().questions[questionToDelete].id;
      
      // If question has an ID (exists in DB), delete it
      if (questionId) {
        await apiRequest("DELETE", `/api/questions/${questionId}`, undefined);
        
        // Invalidate questions query
        queryClient.invalidateQueries({ queryKey: [`/api/admin/quizzes/${quiz?.id}/questions`] });
      }
      
      // Remove from form
      remove(questionToDelete);
      
      setQuestionToDelete(null);
      
      toast({
        title: "Question Deleted",
        description: "The question has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete question",
        variant: "destructive",
      });
    }
  };
  
  if (isLoadingTournament || isLoadingQuiz || isLoadingQuestions) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!tournament || !quiz) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-10 w-10 text-error mb-4" />
          <h2 className="text-xl font-bold mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz you're trying to edit does not exist.</p>
          <Button onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(`/admin/tournaments/${tournamentId}/edit`)}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Quiz</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-primary" />
            {tournament.name}
          </CardTitle>
          <CardDescription>
            Edit quiz questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. General Knowledge Quiz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-8">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                        {fields.length > 3 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setQuestionToDelete(index)}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setQuestionToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`questions.${index}.question`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your question here" 
                                className="resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <FormLabel>Options</FormLabel>
                        {[0, 1, 2, 3].map((optionIndex) => (
                          <FormField
                            key={optionIndex}
                            control={form.control}
                            name={`questions.${index}.options.${optionIndex}`}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                    <div className="flex-1">
                                      <Input 
                                        placeholder={`Option ${optionIndex + 1}`} 
                                        {...field} 
                                      />
                                    </div>
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.correctAnswer`}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Correct Answer</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  {[0, 1, 2, 3].map((optionIndex) => (
                                    <div key={optionIndex} className="flex items-center space-x-2">
                                      <RadioGroupItem value={optionIndex.toString()} id={`q${index}-option-${optionIndex}`} />
                                      <Label htmlFor={`q${index}-option-${optionIndex}`}>Option {optionIndex + 1}</Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`questions.${index}.timer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Timer (seconds)</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select timer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="10">10 seconds</SelectItem>
                                  <SelectItem value="15">15 seconds</SelectItem>
                                  <SelectItem value="20">20 seconds</SelectItem>
                                  <SelectItem value="30">30 seconds</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate(`/admin/tournaments/${tournamentId}/edit`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Timer className="h-5 w-5 mr-2" />
            Quiz Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Quiz Settings</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{fields.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">Multiple Choice</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Question Timer:</span>
                  <span className="font-medium">10-30 seconds per question</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quiz Behavior</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">Auto-next:</span>
                  <span className="font-medium">Yes</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Allow Skip:</span>
                  <span className="font-medium">No</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Results Visibility:</span>
                  <span className="font-medium">After tournament ends</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button 
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            variant="outline" 
            className="w-full"
          >
            View Tournament Page
          </Button>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default EditQuiz;
