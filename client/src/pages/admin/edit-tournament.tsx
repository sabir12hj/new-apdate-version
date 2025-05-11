import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, Trophy, Calendar, DollarSign, Users, Clock, AlertTriangle, Trash } from "lucide-react";

// Define form schema
const tournamentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  entryFee: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Entry fee must be a positive number" }
  ),
  prizePool: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 
    { message: "Prize pool must be a positive number" }
  ),
  totalSlots: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "Total slots must be a positive number" }
  ),
  startDate: z.string().refine(val => val.length > 0, "Start date is required"),
  startTime: z.string().refine(val => val.length > 0, "Start time is required"),
  endDate: z.string().refine(val => val.length > 0, "End date is required"),
  endTime: z.string().refine(val => val.length > 0, "End time is required"),
  isPublished: z.boolean().optional(),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

const EditTournament = () => {
  const { id } = useParams();
  const tournamentId = parseInt(id);
  const { requireAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Make sure user is admin
  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);
  
  // Fetch tournament data
  const { data: tournament, isLoading } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}`],
    staleTime: 30000, // 30 seconds
  });
  
  // Initialize form with tournament data when it's loaded
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      entryFee: "",
      prizePool: "",
      totalSlots: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      isPublished: false,
    },
  });
  
  // Update form values when tournament data is loaded
  useEffect(() => {
    if (tournament) {
      const startDate = new Date(tournament.startTime);
      const endDate = new Date(tournament.endTime);
      
      form.reset({
        name: tournament.name,
        description: tournament.description,
        entryFee: tournament.entryFee.toString(),
        prizePool: tournament.prizePool.toString(),
        totalSlots: tournament.totalSlots.toString(),
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        isPublished: tournament.isPublished,
      });
    }
  }, [tournament, form]);
  
  // Submit handler
  const onSubmit: SubmitHandler<TournamentFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Combine date and time into ISO strings
      const startTime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
      const endTime = new Date(`${data.endDate}T${data.endTime}`).toISOString();
      
      // Validate that end time is after start time
      if (new Date(endTime) <= new Date(startTime)) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const tournamentData = {
        name: data.name,
        description: data.description,
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        totalSlots: parseInt(data.totalSlots),
        startTime,
        endTime,
        isPublished: data.isPublished,
      };
      
      await apiRequest("PUT", `/api/tournaments/${tournamentId}`, tournamentData);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      
      toast({
        title: "Tournament Updated",
        description: "The tournament has been updated successfully.",
      });
      
      navigate("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tournament",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete tournament handler
  const deleteTournament = async () => {
    try {
      setIsDeleting(true);
      
      await apiRequest("DELETE", `/api/tournaments/${tournamentId}`, undefined);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      
      toast({
        title: "Tournament Deleted",
        description: "The tournament has been deleted successfully.",
      });
      
      navigate("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tournament",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Publish tournament results
  const publishResults = async () => {
    try {
      setIsSubmitting(true);
      
      await apiRequest("POST", `/api/tournaments/${tournamentId}/publish-results`, undefined);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      
      toast({
        title: "Results Published",
        description: "The tournament results have been published successfully.",
      });
      
      navigate("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish results",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!tournament) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-10 w-10 text-error mb-4" />
          <h2 className="text-xl font-bold mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-4">The tournament you're trying to edit does not exist.</p>
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
          onClick={() => navigate("/admin")}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Tournament</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-primary" />
            {tournament.name}
          </CardTitle>
          <CardDescription>
            Edit tournament details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. General Knowledge Masters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this quiz tournament is about..." 
                          className="min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee (₹)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input className="pl-10" type="number" min="0" step="1" placeholder="100" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="prizePool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prize Pool (₹)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input className="pl-10" type="number" min="0" step="100" placeholder="10000" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="totalSlots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Slots</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <Input className="pl-10" type="number" min="1" step="1" placeholder="100" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Maximum number of participants
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input className="pl-10" type="date" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input className="pl-10" type="time" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input className="pl-10" type="date" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                              <Input className="pl-10" type="time" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Tournament</FormLabel>
                        <FormDescription>
                          Make this tournament visible to users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between">
                <div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isDeleting}>
                        <Trash className="h-4 w-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete Tournament"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the tournament
                          and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteTournament} className="bg-destructive text-destructive-foreground">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Tournament management actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Management</CardTitle>
          <CardDescription>
            Additional actions for this tournament
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Quiz Management</Label>
            <div className="flex space-x-2">
              <Button 
                onClick={() => navigate(`/admin/tournaments/${tournamentId}/quiz/edit`)}
                variant="outline"
              >
                Edit Quiz
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Label>Results</Label>
            <div className="flex space-x-2">
              {tournament.resultPublished ? (
                <Button disabled variant="outline">
                  Results Published
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary">
                      Publish Results
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish Tournament Results?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will calculate winners, distribute prizes, and make results visible to all participants.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={publishResults}>
                        Publish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button variant="outline" onClick={() => navigate(`/tournaments/${tournamentId}/leaderboard`)}>
                View Leaderboard
              </Button>
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

export default EditTournament;
