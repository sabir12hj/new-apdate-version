import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Join tournament by paying entry fee
  const joinTournament = async (tournamentId: number, paymentMethod: "wallet" | "paytm" | "upi") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to join the tournament",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsProcessing(true);
      
      const response = await apiRequest("POST", `/api/tournaments/${tournamentId}/join`, {
        method: paymentMethod,
      });
      
      const data = await response.json();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      
      toast({
        title: "Payment successful",
        description: "You have successfully joined the tournament!",
      });
      
      // Return payment data for further processing if needed
      return data;
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again or use another payment method",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Add money to wallet (mock function)
  const addMoneyToWallet = async (amount: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to add money to your wallet",
        variant: "destructive",
      });
      return false;
    }

    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsProcessing(true);
      
      const response = await apiRequest("POST", "/api/wallet/add", { amount });
      const data = await response.json();
      
      // Invalidate wallet query
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      
      toast({
        title: "Money added successfully",
        description: `₹${amount} has been added to your wallet`,
      });
      
      return data;
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    joinTournament,
    addMoneyToWallet,
    isProcessing,
  };
};
