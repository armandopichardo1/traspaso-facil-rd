import { Home, PlusCircle, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Traspasos", path: "/gestor" },
  { icon: PlusCircle, label: "Nuevo", path: "/gestor/nuevo" },
  { icon: UserCircle, label: "Perfil", path: "/app/perfil" },
];

export default function GestorBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.path ||
            (item.path === "/gestor" && location.pathname === "/gestor");
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                active ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
