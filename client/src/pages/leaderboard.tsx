import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Search, Award, Medal, Clock } from "lucide-react";

const Leaderboard = () => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  // Get all tournaments for dropdown
  const { data: tournaments, isLoading: isLoadingTournaments } = useQuery({
    queryKey: ["/api/tournaments"],
    staleTime: 60000, // 1 minute
  });

  // Get recent winners
  const { data: recentWinners, isLoading: isLoadingWinners } = useQuery({
    queryKey: ["/api/winners/recent"],
    staleTime: 60000, // 1 minute
  });

  // Get tournament-specific leaderboard
  const { data: tournamentLeaderboard, isLoading: isLoadingTournamentLeaderboard } = useQuery({
    queryKey: [`/api/tournaments/${selectedTournamentId}/leaderboard`],
    staleTime: 60000, // 1 minute
    enabled: !!selectedTournamentId,
  });

  // Get current tournament name
  const getCurrentTournamentName = () => {
    if (!selectedTournamentId || !tournaments) return "Select a Tournament";
    const tournament = tournaments.find((t: any) => t.id === selectedTournamentId);
    return tournament ? tournament.name : "Tournament";
  };

  // Columns for recent winners table
  const recentWinnersColumns = [
    {
      header: "Rank",
      accessorKey: "rank",
      cell: (winner: any) => {
        let badgeClass = "bg-gray-200 text-gray-800";
        if (winner.rank === 1) badgeClass = "bg-primary text-white";
        if (winner.rank === 2) badgeClass = "bg-secondary text-white";
        if (winner.rank === 3) badgeClass = "bg-accent text-white";
        
        return (
          <div className="flex justify-center items-center">
            <div className={`${badgeClass} rounded-full w-8 h-8 flex items-center justify-center font-bold`}>
              {winner.rank}
            </div>
          </div>
        );
      },
    },
    {
      header: "Player",
      accessorKey: "username",
      cell: (winner: any) => (
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback>
              {winner.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="font-medium">{winner.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Tournament",
      accessorKey: "tournamentName",
    },
    {
      header: "Score",
      accessorKey: "score",
    },
    {
      header: "Prize",
      accessorKey: "prize",
      cell: (winner: any) => (
        <div className="font-bold text-accent">
          ₹{parseFloat(winner.prize).toLocaleString()}
        </div>
      ),
    },
  ];

  // Columns for tournament leaderboard table
  const tournamentLeaderboardColumns = [
    {
      header: "Rank",
      accessorKey: "rank",
      cell: (player: any) => {
        let badgeClass = "bg-gray-200 text-gray-800";
        if (player.rank === 1) badgeClass = "bg-primary text-white";
        if (player.rank === 2) badgeClass = "bg-secondary text-white";
        if (player.rank === 3) badgeClass = "bg-accent text-white";
        
        return (
          <div className="flex justify-center items-center">
            <div className={`${badgeClass} rounded-full w-8 h-8 flex items-center justify-center font-bold`}>
              {player.rank}
            </div>
          </div>
        );
      },
    },
    {
      header: "Player",
      accessorKey: "username",
      cell: (player: any) => (
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback>
              {player.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="font-medium">{player.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: (player: any) => (
        <div className="flex items-center">
          <Award className="h-4 w-4 mr-2 text-secondary" />
          <span>{player.score}</span>
        </div>
      ),
    },
    {
      header: "Time Taken",
      accessorKey: "timeTaken",
      cell: (player: any) => {
        const minutes = Math.floor(player.timeTaken / 60);
        const seconds = player.timeTaken % 60;
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {minutes}m {seconds}s
            </span>
          </div>
        );
      },
    },
    {
      header: "Prize",
      accessorKey: "prize",
      cell: (player: any) => (
        <div className="font-bold text-accent">
          ₹{parseFloat(player.prize).toLocaleString()}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-heading">Leaderboards</h1>
      </div>

      <Tabs defaultValue="recent" className="mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="recent">Recent Winners</TabsTrigger>
          <TabsTrigger value="tournament">Tournament Leaderboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 text-primary mr-2" />
                Recent Winners
              </CardTitle>
              <CardDescription>Players who recently won prizes in tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentWinners || []}
                columns={recentWinnersColumns}
                isLoading={isLoadingWinners}
                searchable={true}
                searchPlaceholder="Search winners..."
                searchKeys={["username", "tournamentName"]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tournament">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Medal className="h-5 w-5 text-secondary mr-2" />
                {getCurrentTournamentName()}
              </CardTitle>
              <CardDescription>Select a tournament to view its leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    className="pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 w-full md:w-96"
                    value={selectedTournamentId || ""}
                    onChange={(e) => setSelectedTournamentId(Number(e.target.value) || null)}
                  >
                    <option value="">Select a Tournament</option>
                    {isLoadingTournaments ? (
                      <option disabled>Loading tournaments...</option>
                    ) : tournaments && tournaments.length > 0 ? (
                      tournaments.map((tournament: any) => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No tournaments available</option>
                    )}
                  </select>
                </div>
              </div>
              
              {selectedTournamentId ? (
                <DataTable
                  data={tournamentLeaderboard || []}
                  columns={tournamentLeaderboardColumns}
                  isLoading={isLoadingTournamentLeaderboard}
                  searchable={true}
                  searchPlaceholder="Search players..."
                  searchKeys={["username"]}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Medal className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Select a tournament to view its leaderboard</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard;
