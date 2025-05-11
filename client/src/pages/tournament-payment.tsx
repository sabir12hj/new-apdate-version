import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePayment } from "@/hooks/usePayment";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

const TournamentPayment = () => {
  const { id } = useParams();
  const tournamentId = parseInt(id);
  const [, navigate] = useLocation();
  const { user, requireAuth } = useAuth();
  const { joinTournament, isProcessing } = usePayment();
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "paytm" | "upi">("wallet");

  // Make sure user is authenticated
  useEffect(() => {
    requireAuth(`/login?redirectTo=/tournaments/${tournamentId}/payment`);
  }, [requireAuth, tournamentId]);

  // Fetch tournament details
  const { data: tournament, isLoading: isLoadingTournament } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}`],
    staleTime: 30000, // 30 seconds
  });

  // Fetch user's wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet"],
    staleTime: 30000,
    enabled: !!user,
  });

  // Check if tournament is valid for payment
  const isValidTournament = tournament && (
    new Date(tournament.startTime) > new Date() || // Upcoming tournament
    (new Date(tournament.startTime) <= new Date() && new Date(tournament.endTime) >= new Date()) // Live tournament
  );

  // Check if user has enough balance for wallet payment
  const hasEnoughBalance = user && walletData && 
    parseFloat(walletData.wallet) >= (tournament ? parseFloat(tournament.entryFee) : 0);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "PPP 'at' p");
  };

  // Handle payment
  const handlePayment = async () => {
    if (!tournament) return;
    
    const result = await joinTournament(tournamentId, paymentMethod);
    if (result) {
      navigate(`/tournaments/${tournamentId}`);
    }
  };

  if (isLoadingTournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        
        <Skeleton className="h-40 w-full mb-8" />
        
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (!tournament || !isValidTournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Tournament Not Available</h1>
        <p className="mb-6">
          {!tournament 
            ? "The tournament you're looking for doesn't exist or has been removed." 
            : "This tournament is no longer available for registration."}
        </p>
        <Button onClick={() => navigate("/tournaments")}>
          View All Tournaments
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Join Tournament</h1>
      <p className="text-gray-600 mb-8">Complete payment to secure your spot</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tournament Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{tournament.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDateTime(tournament.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">15 questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">~8 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prize Pool:</span>
                <span className="font-bold text-accent">₹{parseFloat(tournament.prizePool).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Entry Fee:</span>
                <span className="font-medium">₹{parseFloat(tournament.entryFee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee:</span>
                <span className="font-medium">₹0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-accent">-₹0</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-bold">Total Amount:</span>
                <span className="font-bold">₹{parseFloat(tournament.entryFee).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={(value) => setPaymentMethod(value as "wallet" | "paytm" | "upi")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wallet" id="wallet" disabled={!hasEnoughBalance} />
              <Label htmlFor="wallet" className={!hasEnoughBalance ? "text-gray-400" : ""}>
                Pay from Wallet (Balance: ₹{walletData?.wallet ? parseFloat(walletData.wallet).toLocaleString() : "0"})
                {!hasEnoughBalance && (
                  <span className="text-error text-sm ml-2">Insufficient balance</span>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paytm" id="paytm" />
              <Label htmlFor="paytm">Paytm</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi">UPI</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/tournaments/${tournamentId}`)} 
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePayment} 
          disabled={isProcessing || (paymentMethod === "wallet" && !hasEnoughBalance)}
        >
          {isProcessing ? "Processing..." : `Pay ₹${parseFloat(tournament.entryFee).toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
};

export default TournamentPayment;
