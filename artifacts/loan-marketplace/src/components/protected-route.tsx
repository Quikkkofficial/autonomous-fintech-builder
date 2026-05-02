import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { roleHomePath } from "@/lib/api";

function roleLoginPath(allowedRoles?: Array<string>): string {
  if (!allowedRoles) return "/login";
  if (allowedRoles.includes("admin")) return "/admin/login";
  if (allowedRoles.includes("sales_partner") || allowedRoles.includes("collection_partner")) return "/partner/login";
  return "/login";
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<string>;
}) {
  const { user, isLoading, error } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (error || !user) {
      setLocation(roleLoginPath(allowedRoles));
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role ?? "customer")) {
      setLocation(roleHomePath(user.role));
    }
  }, [user, isLoading, error, setLocation, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role ?? "customer")) return null;

  return <>{children}</>;
}
