import { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleError = (error: FirebaseError) => {
    console.error('Google Auth Error:', error);
    let errorMessage = 'Failed to sign in with Google';
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled. You closed the popup window.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
    }
    
    toast({
      title: 'Authentication Failed',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      // Use popup for desktop/non-mobile devices
      const result = await signInWithPopup(auth, googleProvider);

      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info
      const user = result.user;
      
      // Get the Firebase ID token to send to backend
      const idToken = await user.getIdToken();
      
      // Invalidate the auth query to force a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      return { user, token, idToken };
    } catch (error: any) {
      if (error && error.code && typeof error.code === 'string') {
        handleError(error as FirebaseError);
      } else {
        console.error('Unexpected error during Google sign-in:', error);
        toast({
          title: 'Authentication Failed',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogleRedirect = async () => {
    try {
      setIsLoading(true);
      // This will redirect the page, so we won't return from here
      await signInWithRedirect(auth, googleProvider);
      // Code after this point won't execute due to page redirect
    } catch (error: any) {
      setIsLoading(false);
      if (error && error.code && typeof error.code === 'string') {
        handleError(error as FirebaseError);
      } else {
        console.error('Unexpected error during Google sign-in redirect:', error);
        toast({
          title: 'Authentication Failed',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  return {
    signInWithGoogle,
    signInWithGoogleRedirect,
    isLoading
  };
}
