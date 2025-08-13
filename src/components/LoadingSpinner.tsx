import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({ message = "Loading...", size = "md" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary mb-4`} />
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  );
};

export const FullPageLoader = ({ message }: { message?: string }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner message={message} size="lg" />
    </div>
  );
};
