import { useQuery } from "@tanstack/react-query";
import HeroBanner from "@/components/HeroBanner";
import TournamentCard from "@/components/TournamentCard";
import HowItWorks from "@/components/HowItWorks";
import RecentWinners from "@/components/RecentWinners";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <HeroBanner />

      {/* Live Tournaments */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Live Tournaments</h2>
          <Link href="/tournaments">
            <a className="text-primary font-medium hover:underline">View All</a>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingLive ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
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
            ))
          ) : liveTournaments && liveTournaments.length > 0 ? (
            liveTournaments.slice(0, 3).map((tournament: any) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                participantsCount={Math.floor(Math.random() * tournament.totalSlots)} // This should come from API
                isLive={true}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">No live tournaments at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tournaments */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Upcoming Tournaments</h2>
          <Link href="/tournaments">
            <a className="text-primary font-medium hover:underline">View All</a>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingUpcoming ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
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
            ))
          ) : upcomingTournaments && upcomingTournaments.length > 0 ? (
            upcomingTournaments.slice(0, 3).map((tournament: any) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                participantsCount={Math.floor(Math.random() * (tournament.totalSlots / 2))} // This should come from API
                isLive={false}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">No upcoming tournaments at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Recent Winners */}
      <RecentWinners />
    </div>
  );
};

export default Home;
