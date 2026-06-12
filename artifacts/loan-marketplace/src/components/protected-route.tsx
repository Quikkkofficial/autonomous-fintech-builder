import { useAuth as useClerkAuth } from "@clerk/react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { roleHomePath } from "@/lib/api";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<string>;
}) {
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    if (isLoading) return;
    if (allowedRoles && user && !allowedRoles.includes(user.role ?? "customer")) {
      setLocation(roleHomePath(user.role));
    }
  }, [clerkLoaded, isSignedIn, user, isLoading, setLocation, allowedRoles]);

  if (!clerkLoaded || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role ?? "customer")) return null;

  return <>{children}</>;
}
