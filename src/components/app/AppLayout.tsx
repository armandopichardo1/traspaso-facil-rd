import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-sm px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  // If profile exists but nombre is not set, redirect to complete profile
  if (profile && !profile.nombre && location.pathname !== "/app/complete-profile") {
    return <Navigate to="/app/complete-profile" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
