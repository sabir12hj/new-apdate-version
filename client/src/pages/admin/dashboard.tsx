import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Calendar,
  Edit,
  Trash,
  Eye,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const { requireAdmin } = useAuth();

  // Check if we have an admin user
  const { user } = useAuth();
  
  useEffect(() => {
    // Log the current user and admin status for debugging
    console.log('Admin Dashboard - Current user:', user);
    console.log('Admin Dashboard - Is admin:', user?.isAdmin);
  }, [user]);

  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    staleTime: 60000, // 1 minute
  });

  // Fetch all tournaments
  const { data: tournaments, isLoading: isLoadingTournaments } = useQuery({
    queryKey: ["/api/tournaments"],
    staleTime: 60000, // 1 minute
  });

  // Format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "PPP");
  };

  // Get status of tournament
  const getTournamentStatus = (tournament: any) => {
    const now = new Date();
    const startTime = new Date(tournament.startTime);
    const endTime = new Date(tournament.endTime);

    if (now < startTime) return "upcoming";
    if (now >= startTime && now <= endTime) return "live";
    return "ended";
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let badgeClass = "";
    let statusText = "";

    switch (status) {
      case "live":
        badgeClass = "bg-green-100 text-green-800";
        statusText = "Live";
        break;
      case "upcoming":
        badgeClass = "bg-blue-100 text-blue-800";
        statusText = "Upcoming";
        break;
      case "ended":
        badgeClass = "bg-gray-100 text-gray-800";
        statusText = "Ended";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800";
        statusText = "Unknown";
    }

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
        {statusText}
      </span>
    );
  };

  // Tournament table columns
  const tournamentColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (tournament: any) => (
        <div>
          <div className="font-medium">{tournament.name}</div>
          <div className="text-sm text-gray-500">
            {tournament.totalSlots} slots • ₹{parseFloat(tournament.entryFee).toLocaleString()} entry
          </div>
        </div>
      ),
    },
    {
      header: "Entry Fee",
      accessorKey: "entryFee",
      cell: (tournament: any) => (
        <div className="font-medium">₹{parseFloat(tournament.entryFee).toLocaleString()}</div>
      ),
    },
    {
      header: "Prize Pool",
      accessorKey: "prizePool",
      cell: (tournament: any) => (
        <div className="font-medium">₹{parseFloat(tournament.prizePool).toLocaleString()}</div>
      ),
    },
    {
      header: "Start Date",
      accessorKey: "startTime",
      cell: (tournament: any) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span>{formatDateTime(tournament.startTime)}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (tournament: any) => renderStatusBadge(getTournamentStatus(tournament)),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (tournament: any) => (
        <div className="flex space-x-2">
          <Link href={`/admin/tournaments/${tournament.id}/edit`}>
            <div className="text-secondary hover:text-secondary/80 cursor-pointer">
              <Edit className="h-4 w-4" />
            </div>
          </Link>
          <Link href={`/tournaments/${tournament.id}`}>
            <div className="text-gray-600 hover:text-gray-800 cursor-pointer">
              <Eye className="h-4 w-4" />
            </div>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage tournaments, quizzes, and users</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Trophy className="text-primary h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Active Tournaments</h3>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="font-bold text-2xl">{stats?.liveTournaments || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-accent/10 p-3 rounded-full">
                <Users className="text-accent h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Total Participants</h3>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="font-bold text-2xl">{stats?.totalParticipants || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-secondary/10 p-3 rounded-full">
                <DollarSign className="text-secondary h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Revenue</h3>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="font-bold text-2xl">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournaments Table */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Tournaments</CardTitle>
            <CardDescription>View and manage your tournaments</CardDescription>
          </div>
          <Link href="/admin/tournaments/create">
            <div>
              <Button>
                <Trophy className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </div>
          </Link>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tournaments || []}
            columns={tournamentColumns}
            isLoading={isLoadingTournaments}
            searchable={true}
            searchPlaceholder="Search tournaments..."
            searchKeys={["name", "description"]}
          />
        </CardContent>
      </Card>

      {/* Live Tournament Dashboard (if any) */}
      {tournaments && tournaments.some((t: any) => getTournamentStatus(t) === "live") && (
        <Card>
          <CardHeader>
            <CardTitle>Live Tournament Dashboard</CardTitle>
            <CardDescription>
              Monitor and manage currently active tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournaments
              .filter((t: any) => getTournamentStatus(t) === "live")
              .map((tournament: any) => (
                <div key={tournament.id} className="mb-6">
                  <h3 className="font-bold mb-2">{tournament.name}</h3>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="bg-neutral rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-500">Participants</div>
                      <div className="font-bold text-xl">
                        {/* This would come from API in a real app */}
                        {Math.floor(Math.random() * tournament.totalSlots)}/{tournament.totalSlots}
                      </div>
                    </div>
                    <div className="bg-neutral rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-500">Time Remaining</div>
                      <div className="font-bold text-xl text-error">
                        <Clock className="inline-block h-4 w-4 mr-1" />
                        {format(new Date(tournament.endTime), "HH:mm:ss")}
                      </div>
                    </div>
                    <div className="bg-neutral rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-500">Prize Pool</div>
                      <div className="font-bold text-xl">
                        ₹{parseFloat(tournament.prizePool).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Actions</h4>
                      {!tournament.resultPublished && (
                        <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                          <div>
                            <Button size="sm" variant="outline">
                              Publish Results
                            </Button>
                          </div>
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                        <div>
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </Link>
                      <Link href={`/tournaments/${tournament.id}`}>
                        <div>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
