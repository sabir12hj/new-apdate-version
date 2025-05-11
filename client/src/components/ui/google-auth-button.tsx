import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { SiGoogle } from "react-icons/si";

type GoogleAuthButtonProps = {
  redirectMethod?: boolean;
  text?: string;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
};

export function GoogleAuthButton({
  redirectMethod = false,
  text = "Sign in with Google",
  className = "",
  fullWidth = false,
  disabled = false,
}: GoogleAuthButtonProps) {
  const { signInWithGoogle, signInWithGoogleRedirect, isLoading } = useGoogleAuth();

  // Detect if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  const handleClick = () => {
    // Use redirect method on mobile or if explicitly requested
    if (redirectMethod || isMobile) {
      signInWithGoogleRedirect();
    } else {
      signInWithGoogle();
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading || disabled}
      className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-t-2 border-b-2 border-current rounded-full animate-spin mr-2"></div>
      ) : (
        <SiGoogle className="w-4 h-4" />
      )}
      {text}
    </Button>
  );
}