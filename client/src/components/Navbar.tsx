import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trophy, Menu, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Tournaments", path: "/tournaments" },
    { name: "Leaderboard", path: "/leaderboard" },
  ];

  if (user) {
    navLinks.push({ name: "Wallet", path: "/wallet" });
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <Trophy className="text-primary h-6 w-6 mr-2" />
                <span className="font-heading font-bold text-xl">QuizTournament</span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link href={link.path} key={link.path}>
                <span className={`font-medium hover:text-primary transition-colors cursor-pointer ${
                  location === link.path ? "text-primary" : ""
                }`}>
                  {link.name}
                </span>
              </Link>
            ))}
            
            {user ? (
              <div className="relative ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                      <div className="h-8 w-8 rounded-full bg-secondary text-white flex items-center justify-center">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2">{user.username}</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAdmin && (
                      <>
                        <Link href="/admin">
                          <div className="cursor-pointer">
                            <DropdownMenuItem>
                              Admin Dashboard
                            </DropdownMenuItem>
                          </div>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <Link href="/profile">
                      <div className="cursor-pointer">
                        <DropdownMenuItem>
                          My Profile
                        </DropdownMenuItem>
                      </div>
                    </Link>
                    <Link href="/wallet">
                      <div className="cursor-pointer">
                        <DropdownMenuItem>
                          Wallet: ₹{parseFloat(user.wallet).toFixed(2)}
                        </DropdownMenuItem>
                      </div>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button>Sign In / Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-primary transition duration-150 ease-in-out"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link href={link.path} key={link.path}>
                <div 
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:text-primary hover:bg-gray-50 cursor-pointer ${
                    location === link.path ? "text-primary" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="flex items-center px-5">
                <div className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-5">
                <Link href="/auth">
                  <Button 
                    className="w-full" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In / Sign Up
                  </Button>
                </Link>
              </div>
            )}
            
            {user && (
              <div className="mt-3 px-2 space-y-1">
                {isAdmin && (
                  <Link href="/admin">
                    <div
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </div>
                  </Link>
                )}
                <Link href="/profile">
                  <div
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </div>
                </Link>
                <Link href="/wallet">
                  <div
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Wallet: ₹{parseFloat(user.wallet).toFixed(2)}
                  </div>
                </Link>
                <div
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
