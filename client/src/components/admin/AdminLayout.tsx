import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Trophy,
  LayoutDashboard,
  Users,
  CreditCard,
  HelpCircle,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
    },
    {
      name: "Tournaments",
      path: "/admin/tournaments/create",
      icon: <Trophy className="h-5 w-5 mr-3" />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5 mr-3" />,
    },
    {
      name: "Payments",
      path: "/admin/payments",
      icon: <CreditCard className="h-5 w-5 mr-3" />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <Settings className="h-5 w-5 mr-3" />,
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg fixed md:static inset-y-0 left-0 z-30 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}
      >
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h2 className="font-bold">Admin Panel</h2>
              <p className="text-sm text-gray-600">Welcome, {user?.username || "Admin"}!</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`${
                    location === item.path
                      ? "bg-secondary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200">
          <Link href="/">
            <div
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
              <HelpCircle className="h-5 w-5 mr-3" />
              Back to Site
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-auto bg-neutral">
        <div className="max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
