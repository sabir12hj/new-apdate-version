import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import AuthRedirect from "@/pages/auth-redirect";
import Tournaments from "@/pages/tournaments";
import TournamentDetail from "@/pages/tournament-detail";
import TournamentPayment from "@/pages/tournament-payment";
import Quiz from "@/pages/quiz";
import Leaderboard from "@/pages/leaderboard";
import Wallet from "@/pages/wallet";
import Profile from "@/pages/profile";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import CreateTournament from "@/pages/admin/create-tournament";
import EditTournament from "@/pages/admin/edit-tournament";
import CreateQuiz from "@/pages/admin/create-quiz";
import EditQuiz from "@/pages/admin/edit-quiz";
import Users from "@/pages/admin/users";
import Payments from "@/pages/admin/payments";

// Protected route components
const AdminRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  console.log(`AdminRoute check for path ${rest.path} - User ID:`, user?.id, 'isAdmin:', user?.isAdmin);
  
  // Show loading state while auth is being checked
  if (isLoading) {
    return <Route {...rest}>{() => <div className="p-8 text-center">Loading authentication...</div>}</Route>;
  }
  
  // Check if user is an admin
  const isAdmin = user?.isAdmin === true;
  console.log(`Access decision for ${rest.path}: ${isAdmin ? 'GRANTED' : 'DENIED'}`);
  
  return <Route {...rest}>
    {() => isAdmin ? <Component /> : <Redirect to="/" />}
  </Route>;
};

const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) => {
  const { user, isLoading } = useAuth();
  console.log('ProtectedRoute check - User:', user);
  
  // Show loading state while auth is being checked
  if (isLoading) {
    return <Route {...rest}>{() => <div>Loading...</div>}</Route>;
  }
  
  // Check if user is authenticated
  return <Route {...rest}>
    {() => user ? <Component /> : <Redirect to="/auth" />}
  </Route>;
};

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth-redirect" component={AuthRedirect} />
      <Route path="/tournaments" component={Tournaments} />
      <Route path="/tournaments/:id" component={TournamentDetail} />
      <Route path="/leaderboard" component={Leaderboard} />
      
      {/* Admin routes */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/tournaments/create" component={CreateTournament} />
      <AdminRoute path="/admin/tournaments/:id/edit" component={EditTournament} />
      <AdminRoute path="/admin/tournaments/:id/quiz/create" component={CreateQuiz} />
      <AdminRoute path="/admin/tournaments/:id/quiz/edit" component={EditQuiz} />
      <AdminRoute path="/admin/users" component={Users} />
      <AdminRoute path="/admin/payments" component={Payments} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/tournaments/:id/payment" component={TournamentPayment} />
      <ProtectedRoute path="/tournaments/:id/quiz" component={Quiz} />
      <ProtectedRoute path="/wallet" component={Wallet} />
      <ProtectedRoute path="/profile" component={Profile} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAuthRedirect = location === '/auth-redirect';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            {!isAuthRedirect && <Navbar />}
            <main className={`flex-1 ${isAuthRedirect ? 'bg-background' : ''}`}>
              <Router />
            </main>
            {!isAuthRedirect && <Footer />}
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
