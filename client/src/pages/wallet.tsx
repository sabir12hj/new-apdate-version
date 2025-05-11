import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePayment } from "@/hooks/usePayment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { 
  Wallet, 
  PlusCircle, 
  MinusCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar
} from "lucide-react";
import { formatDistance } from "date-fns";

const WalletPage = () => {
  const [amount, setAmount] = useState("");
  const { user, requireAuth } = useAuth();
  const { addMoneyToWallet, isProcessing } = usePayment();

  // Make sure user is authenticated
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Fetch wallet balance
  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ["/api/wallet"],
    staleTime: 30000, // 30 seconds
    enabled: !!user,
  });

  // Handle adding money to wallet
  const handleAddMoney = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;
    
    await addMoneyToWallet(numericAmount);
    setAmount("");
  };

  // Mock transaction history data (this would come from API in a real app)
  const transactionColumns = [
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (transaction: any) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span>{formatDistance(new Date(transaction.createdAt), new Date(), { addSuffix: true })}</span>
        </div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (transaction: any) => (
        <div className="flex items-center">
          {transaction.type === 'credit' ? (
            <ArrowDownRight className="h-4 w-4 mr-2 text-accent" />
          ) : (
            <ArrowUpRight className="h-4 w-4 mr-2 text-error" />
          )}
          <span>{transaction.description}</span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (transaction: any) => (
        <div className={`font-medium ${transaction.type === 'credit' ? 'text-accent' : 'text-error'}`}>
          {transaction.type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (transaction: any) => {
        let statusClass = "bg-gray-100 text-gray-800";
        if (transaction.status === "success") statusClass = "bg-green-100 text-green-800";
        if (transaction.status === "pending") statusClass = "bg-yellow-100 text-yellow-800";
        if (transaction.status === "failed") statusClass = "bg-red-100 text-red-800";
        
        return (
          <span className={`${statusClass} px-2 py-1 rounded-full text-xs`}>
            {transaction.status}
          </span>
        );
      },
    },
  ];

  // Mock data - this would come from API in a real app
  const mockTransactions = [
    {
      id: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      description: "Added money to wallet",
      amount: "500",
      type: "credit",
      status: "success"
    },
    {
      id: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      description: "Tournament entry fee - General Knowledge Masters",
      amount: "100",
      type: "debit",
      status: "success"
    },
    {
      id: 3,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      description: "Tournament prize - Sports Quiz Champions",
      amount: "1500",
      type: "credit",
      status: "success"
    },
    {
      id: 4,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      description: "Tournament entry fee - Sports Quiz Champions",
      amount: "200",
      type: "debit",
      status: "success"
    },
    {
      id: 5,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
      description: "Added money to wallet",
      amount: "1000",
      type: "credit",
      status: "success"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold font-heading mb-8">My Wallet</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {/* Wallet Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Wallet Balance
              </CardTitle>
              <CardDescription>Your current wallet balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6">
                <div className="text-4xl font-bold">
                  {isLoadingWallet ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <>₹{parseFloat(walletData?.wallet || "0").toLocaleString()}</>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Add Money Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Money
              </CardTitle>
              <CardDescription>Add funds to your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <span className="text-xl font-bold mr-2">₹</span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="1"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000, 2000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={isProcessing}
                  >
                    ₹{quickAmount}
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleAddMoney}
                disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isProcessing}
              >
                {isProcessing ? "Processing..." : "Add Money"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpRight className="h-5 w-5 mr-2" />
                Transaction History
              </CardTitle>
              <CardDescription>Recent transactions in your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="in">Money In</TabsTrigger>
                  <TabsTrigger value="out">Money Out</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <DataTable
                    data={mockTransactions}
                    columns={transactionColumns}
                    pageSize={5}
                  />
                </TabsContent>
                
                <TabsContent value="in">
                  <DataTable
                    data={mockTransactions.filter(t => t.type === 'credit')}
                    columns={transactionColumns}
                    pageSize={5}
                  />
                </TabsContent>
                
                <TabsContent value="out">
                  <DataTable
                    data={mockTransactions.filter(t => t.type === 'debit')}
                    columns={transactionColumns}
                    pageSize={5}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
