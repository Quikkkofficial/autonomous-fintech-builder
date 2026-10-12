import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { roleHomePath } from "@/lib/api";

// Hard ceiling on the loading spinner: even if the auth check somehow
// stalls, we stop waiting and send the visitor to /sign-in instead of
// hanging forever. The AuthProvider itself times out /me at 5s, so this
// 10s cap is purely defensive.
const GUARD_TIMEOUT_MS = 10_000;

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<string>;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), GUARD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading && !timedOut) return;
    if (!user) {
      setLocation("/sign-in");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role ?? "customer")) {
      setLocation(roleHomePath(user.role));
    }
  }, [user, isLoading, timedOut, setLocation, allowedRoles]);

  if (isLoading && !timedOut) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role ?? "customer")) return null;

  return <>{children}</>;
}
