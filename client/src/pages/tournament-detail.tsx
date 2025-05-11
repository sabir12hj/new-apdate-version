import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/components/ui/countdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Clock, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const TournamentDetail = () => {
  const { id } = useParams();
  const tournamentId = parseInt(id);
  const { user } = useAuth();

  // Fetch tournament details
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}`],
    staleTime: 30000, // 30 seconds
  });

  // Fetch participants
  const { data: participants } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/participants`],
    staleTime: 30000,
    enabled: !!tournamentId,
  });

  // Check if user has joined this tournament
  const hasJoined = participants?.some((participant: any) => 
    participant.userId === user?.id && participant.paymentStatus === "completed"
  );

  // Check if the tournament is active
  const isLive = tournament && new Date(tournament.startTime) <= new Date() && new Date(tournament.endTime) >= new Date();
  const isUpcoming = tournament && new Date(tournament.startTime) > new Date();
  const isEnded = tournament && new Date(tournament.endTime) < new Date();

  // Check if user can attempt quiz (tournament is active and user has joined)
  const canAttemptQuiz = isLive && hasJoined;

  // Format dates and times
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP 'at' p");
  };

  if (isLoadingTournament) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-2/3 max-w-md mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Skeleton className="h-64 w-full mb-8" />
        
        <div className="flex justify-center">
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
        <p className="mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
        <Link href="/tournaments">
          <a>
            <Button>View All Tournaments</Button>
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading mb-4">{tournament.name}</h1>
        <p className="text-gray-600">{tournament.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-bold">Prize Pool</h3>
              </div>
              <span className="text-xl font-bold text-primary">
                ₹{parseFloat(tournament.prizePool).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-secondary mr-2" />
                <h3 className="font-bold">Participants</h3>
              </div>
              <span className="text-xl font-bold">
                {participants?.length || 0}/{tournament.totalSlots}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-accent mr-2" />
                <h3 className="font-bold">
                  {isLive ? "Ends In" : isUpcoming ? "Starts In" : "Ended On"}
                </h3>
              </div>
              {isEnded ? (
                <span className="text-lg font-bold">
                  {formatDateTime(tournament.endTime)}
                </span>
              ) : (
                <Countdown
                  targetDate={new Date(isLive ? tournament.endTime : tournament.startTime)}
                  type={isLive ? "warning" : "normal"}
                  size="lg"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
          <CardDescription>Information about this quiz tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Tournament Information</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-gray-600">Entry Fee:</span>
                  <span className="font-medium">₹{parseFloat(tournament.entryFee).toLocaleString()}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Slots:</span>
                  <span className="font-medium">{tournament.totalSlots}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Start Time:</span>
                  <span className="font-medium">{formatDateTime(tournament.startTime)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">End Time:</span>
                  <span className="font-medium">{formatDateTime(tournament.endTime)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    isLive 
                      ? "text-green-600" 
                      : isUpcoming 
                        ? "text-blue-600" 
                        : "text-gray-600"
                  }`}>
                    {isLive ? "Live" : isUpcoming ? "Upcoming" : "Ended"}
                  </span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quiz Format</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-gray-600">Question Type:</span>
                  <span className="font-medium">Multiple Choice Questions</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Time per Question:</span>
                  <span className="font-medium">10-30 seconds</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Auto-next:</span>
                  <span className="font-medium">Yes, after timer ends</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Skipping Questions:</span>
                  <span className="font-medium">Not allowed</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Results:</span>
                  <span className="font-medium">After tournament ends</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        {!user ? (
          <Link href={`/login?redirectTo=/tournaments/${tournamentId}`}>
            <a>
              <Button size="lg">
                Login to Join Tournament
              </Button>
            </a>
          </Link>
        ) : hasJoined ? (
          canAttemptQuiz ? (
            <Link href={`/tournaments/${tournamentId}/quiz`}>
              <a>
                <Button size="lg" variant="default">
                  Start Quiz Now
                </Button>
              </a>
            </Link>
          ) : isUpcoming ? (
            <Button size="lg" variant="secondary" disabled>
              Waiting for Tournament to Start
            </Button>
          ) : (
            <Button size="lg" variant="secondary" disabled>
              {tournament.resultPublished ? "Tournament Ended" : "Results Coming Soon"}
            </Button>
          )
        ) : isLive || isUpcoming ? (
          <Link href={`/tournaments/${tournamentId}/payment`}>
            <a>
              <Button size="lg" variant={isLive ? "default" : "secondary"}>
                Join for ₹{parseFloat(tournament.entryFee).toLocaleString()}
              </Button>
            </a>
          </Link>
        ) : (
          <Button size="lg" variant="secondary" disabled>
            Tournament Ended
          </Button>
        )}
      </div>
    </div>
  );
};

export default TournamentDetail;
