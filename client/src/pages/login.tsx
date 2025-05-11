import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trophy } from "lucide-react";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";

// Define form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { loginWithRedirect, googleLoginWithRedirect } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Get query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const redirectTo = queryParams.get("redirectTo") || "/";

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await loginWithRedirect(data.email, data.password, redirectTo);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Google login (in a real app this would use Firebase, Auth0, etc.)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const mockGoogleId = `google-${Date.now()}`;
      const mockEmail = `user${Date.now()}@gmail.com`;
      const mockUsername = `GoogleUser${Date.now()}`;

      await googleLoginWithRedirect(mockGoogleId, mockEmail, mockUsername, redirectTo);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 py-10">
      <div className="flex justify-center mb-6">
        <Link href="/">
          <a className="flex items-center">
            <Trophy className="h-8 w-8 text-primary mr-2" />
            <span className="font-heading font-bold text-2xl">QuizTournament</span>
          </a>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        type="email" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <GoogleAuthButton
            fullWidth
            text="Continue with Google"
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register">
              <a className="text-primary font-medium hover:underline">
                Sign up
              </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
