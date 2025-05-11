import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentCard from "@/components/TournamentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Tournaments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all tournaments
  const { data: allTournaments, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/tournaments"],
    staleTime: 60000, // 1 minute
  });

  // Get live tournaments
  const { data: liveTournaments, isLoading: isLoadingLive } = useQuery({
    queryKey: ["/api/tournaments/live"],
    staleTime: 60000, // 1 minute
  });

  // Get upcoming tournaments
  const { data: upcomingTournaments, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ["/api/tournaments/upcoming"],
    staleTime: 60000, // 1 minute
  });

  // Filter tournaments based on search term
  const filterTournaments = (tournaments: any[] | undefined) => {
    if (!tournaments) return [];
    if (!searchTerm) return tournaments;
    
    return tournaments.filter(tournament => 
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get participants count (mock data, should come from API)
  const getParticipantsCount = (tournament: any) => {
    // This is a placeholder. In a real app, this data would come from the API
    return Math.floor(Math.random() * tournament.totalSlots);
  };

  // Render tournament cards
  const renderTournamentCards = (tournaments: any[] | undefined, isLive: boolean = false, isLoading: boolean = false) => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="relative">
            <Skeleton className="w-full h-48" />
          </div>
          <div className="p-5">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-2 w-full mb-2" />
            <div className="flex justify-between mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ));
    }
    
    const filteredTournaments = filterTournaments(tournaments);
    
    if (filteredTournaments.length === 0) {
      return (
        <div className="col-span-full text-center py-10">
          <p className="text-gray-500">No tournaments found. Please check back later!</p>
        </div>
      );
    }
    
    return filteredTournaments.map((tournament: any) => (
      <TournamentCard
        key={tournament.id}
        tournament={tournament}
        participantsCount={getParticipantsCount(tournament)}
        isLive={isLive}
      />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-heading">Quiz Tournaments</h1>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search tournaments..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all">All Tournaments</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderTournamentCards(allTournaments, false, isLoadingAll)}
          </div>
        </TabsContent>
        
        <TabsContent value="live">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderTournamentCards(liveTournaments, true, isLoadingLive)}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderTournamentCards(upcomingTournaments, false, isLoadingUpcoming)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tournaments;
