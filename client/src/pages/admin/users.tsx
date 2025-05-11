import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { format } from "date-fns";

const UsersPage = () => {
  const { requireAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Make sure user is admin
  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  // Mock user data (in a real app, this would be fetched from the API)
  const generateMockUsers = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      isAdmin: i === 0 || i === 5,
      wallet: (Math.random() * 5000).toFixed(2),
      tournaments: Math.floor(Math.random() * 15),
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  const users = generateMockUsers();

  // Filter users by search term
  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  // Columns for users table
  const userColumns = [
    {
      header: "User",
      accessorKey: "username",
      cell: (user: any) => (
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback>
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="font-medium">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (user: any) => (
        <Badge variant={user.isAdmin ? "secondary" : "outline"}>
          {user.isAdmin ? "Admin" : "User"}
        </Badge>
      ),
    },
    {
      header: "Wallet",
      accessorKey: "wallet",
      cell: (user: any) => (
        <div className="font-medium">₹{parseFloat(user.wallet).toLocaleString()}</div>
      ),
    },
    {
      header: "Tournaments",
      accessorKey: "tournaments",
    },
    {
      header: "Joined",
      accessorKey: "createdAt",
      cell: (user: any) => (
        <div className="text-sm text-gray-500">
          {format(new Date(user.createdAt), "PP")}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-600">View and manage users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            All Users
          </CardTitle>
          <CardDescription>Manage and view all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            data={filteredUsers}
            columns={userColumns}
            searchable={false}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default UsersPage;
