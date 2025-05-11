import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Calendar, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

const PaymentsPage = () => {
  const { requireAdmin } = useAuth();

  // Make sure user is admin
  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  // Mock payment data (in a real app, this would be fetched from the API)
  const generateMockPayments = () => {
    const methods = ["wallet", "paytm", "upi"];
    const statuses = ["success", "pending", "failed"];
    const usernames = ["user1", "user2", "user3", "user4", "user5"];
    const tournaments = [
      "General Knowledge Masters",
      "Sports Quiz Champions",
      "Movie Buff Challenge",
      "Science & Technology"
    ];
    
    return Array.from({ length: 50 }, (_, i) => {
      const amount = Math.floor(Math.random() * 500) + 50;
      const isDeposit = Math.random() > 0.7;
      return {
        id: i + 1,
        userId: Math.floor(Math.random() * 5) + 1,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        tournamentId: Math.floor(Math.random() * 4) + 1,
        tournamentName: isDeposit ? null : tournaments[Math.floor(Math.random() * tournaments.length)],
        amount: amount.toString(),
        type: isDeposit ? "deposit" : "entry_fee",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        transactionId: `tx-${Date.now()}-${i}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  };

  const payments = generateMockPayments();

  // Columns for payments table
  const paymentColumns = [
    {
      header: "Transaction ID",
      accessorKey: "transactionId",
      cell: (payment: any) => (
        <div className="font-mono text-xs">{payment.transactionId.slice(0, 14)}...</div>
      ),
    },
    {
      header: "User",
      accessorKey: "username",
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (payment: any) => (
        <div>
          {payment.type === "deposit" ? (
            <div className="flex items-center">
              <ArrowDownLeft className="h-4 w-4 mr-2 text-accent" />
              <span>Wallet Deposit</span>
            </div>
          ) : (
            <div className="flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-2 text-primary" />
              <span>Tournament Entry Fee - {payment.tournamentName}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (payment: any) => (
        <div className="font-medium">₹{parseFloat(payment.amount).toLocaleString()}</div>
      ),
    },
    {
      header: "Method",
      accessorKey: "method",
      cell: (payment: any) => {
        const methodLabels: Record<string, string> = {
          wallet: "Wallet",
          paytm: "Paytm",
          upi: "UPI"
        };
        
        return <div className="capitalize">{methodLabels[payment.method] || payment.method}</div>;
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (payment: any) => {
        let variant = "outline";
        
        if (payment.status === "success") variant = "success";
        if (payment.status === "pending") variant = "warning";
        if (payment.status === "failed") variant = "destructive";
        
        return (
          <Badge variant={variant as any} className="capitalize">
            {payment.status}
          </Badge>
        );
      },
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (payment: any) => (
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(payment.createdAt), "PP")}
        </div>
      ),
    },
  ];

  // Stats
  const totalRevenue = payments
    .filter(p => p.status === "success")
    .reduce((total, p) => total + parseFloat(p.amount), 0);
  
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  
  const todayRevenue = payments
    .filter(p => 
      p.status === "success" && 
      new Date(p.createdAt).toDateString() === new Date().toDateString()
    )
    .reduce((total, p) => total + parseFloat(p.amount), 0);
  
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-gray-600">Manage and view payment transactions</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="text-primary h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Total Revenue</h3>
                <p className="font-bold text-2xl">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-warning/10 p-3 rounded-full">
                <CreditCard className="text-warning h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Pending Payments</h3>
                <p className="font-bold text-2xl">{pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-accent/10 p-3 rounded-full">
                <ArrowDownLeft className="text-accent h-5 w-5" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Today's Revenue</h3>
                <p className="font-bold text-2xl">₹{todayRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Transactions
          </CardTitle>
          <CardDescription>View and manage all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="entry_fee">Tournament Entries</TabsTrigger>
              <TabsTrigger value="deposit">Wallet Deposits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <DataTable
                data={payments}
                columns={paymentColumns}
                searchable={true}
                searchPlaceholder="Search transactions..."
                searchKeys={["transactionId", "username", "tournamentName"]}
                pageSize={10}
              />
            </TabsContent>
            
            <TabsContent value="entry_fee">
              <DataTable
                data={payments.filter(p => p.type === "entry_fee")}
                columns={paymentColumns}
                searchable={true}
                searchPlaceholder="Search tournament entries..."
                searchKeys={["transactionId", "username", "tournamentName"]}
                pageSize={10}
              />
            </TabsContent>
            
            <TabsContent value="deposit">
              <DataTable
                data={payments.filter(p => p.type === "deposit")}
                columns={paymentColumns}
                searchable={true}
                searchPlaceholder="Search wallet deposits..."
                searchKeys={["transactionId", "username"]}
                pageSize={10}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default PaymentsPage;
