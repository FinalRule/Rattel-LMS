import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

const getErrorExplanation = (error: string) => {
  const errorMap: Record<string, { title: string; description: string }> = {
    "Incorrect email.": {
      title: "Email Not Found",
      description: "We couldn't find an account with this email address. Please check for typos or register for a new account."
    },
    "Incorrect password.": {
      title: "Password Incorrect",
      description: "The password you entered doesn't match our records. Please try again or use the 'Forgot Password' option."
    },
    "Email already exists": {
      title: "Account Already Exists",
      description: "An account with this email already exists. Try logging in instead, or use a different email address."
    },
    "Authentication required": {
      title: "Session Expired",
      description: "Your session has expired or you've been logged out. Please log in again to continue."
    }
  };

  const defaultError = {
    title: "Authentication Error",
    description: "There was a problem with your request. Please try again or contact support if the issue persists."
  };

  return errorMap[error] || {
    title: "Authentication Error",
    description: error || defaultError.description
  };
};

export default function AuthErrorModal({
  isOpen,
  onClose,
  error
}: AuthErrorModalProps) {
  const errorDetails = getErrorExplanation(error);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDialogTitle>{errorDetails.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-4">
            {errorDetails.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
