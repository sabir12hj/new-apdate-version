import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { getAuth, getRedirectResult } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AuthRedirect() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function handleRedirectResult() {
      try {
        setIsProcessing(true);
        const auth = getAuth();
        const result = await getRedirectResult(auth);

        if (!result) {
          // No redirect result, might be a direct access to this page
          setIsProcessing(false);
          setError('No authentication data found. Please try signing in again.');
          return;
        }

        // Get the user from the result
        const user = result.user;
        const idToken = await user.getIdToken();

        if (!user || !idToken) {
          throw new Error('Failed to retrieve user information');
        }

        // Call your backend API to handle Google authentication
        const response = await apiRequest('POST', '/api/auth/google-token', {
          idToken,
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        // Successfully authenticated
        toast({
          title: 'Authentication successful',
          description: 'You have been successfully signed in with Google',
          variant: 'default',
        });

        // Redirect to home page or intended destination
        setTimeout(() => {
          setLocation('/');
        }, 1000);
      } catch (error) {
        console.error('Google auth redirect error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        toast({
          title: 'Authentication failed',
          description: error instanceof Error ? error.message : 'Failed to sign in with Google',
          variant: 'destructive',
        });

        // Redirect back to auth page after showing the error
        setTimeout(() => {
          setLocation('/auth');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    }

    handleRedirectResult();
  }, [setLocation, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      {isProcessing ? (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-8" />
          <h1 className="text-2xl font-bold mb-2">Processing Authentication</h1>
          <p className="text-muted-foreground max-w-md">
            Please wait while we authenticate you with Google...
          </p>
        </>
      ) : error ? (
        <>
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-8">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
          <p className="text-muted-foreground max-w-md mb-8">{error}</p>
          <p className="text-sm">Redirecting you back to login page...</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-8">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Successful</h1>
          <p className="text-muted-foreground max-w-md mb-8">You have been successfully signed in with Google.</p>
          <p className="text-sm">Redirecting you to the homepage...</p>
        </>
      )}
    </div>
  );
}
