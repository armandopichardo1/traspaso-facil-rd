import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import GestorBottomNav from "./GestorBottomNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function GestorLayout() {
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

  if (profile?.role !== "gestor") {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <GestorBottomNav />
    </div>
  );
}
