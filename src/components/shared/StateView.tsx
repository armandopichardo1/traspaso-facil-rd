import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Inbox, RefreshCw, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Estados de UI consistentes: loading / empty / error / not-found.
 * Úsalo en todas las pantallas que consumen React Query para
 * estandarizar la experiencia.
 */

export function LoadingSkeleton({
  rows = 3,
  className = "p-4 max-w-lg mx-auto space-y-3",
  rowClassName = "h-24 w-full rounded-xl",
  showHeader = true,
}: {
  rows?: number;
  className?: string;
  rowClassName?: string;
  showHeader?: boolean;
}) {
  return (
    <div className={className}>
      {showHeader && <Skeleton className="h-8 w-48" />}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-8 text-center">
        <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Algo salió mal",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="rounded-xl border-destructive/30 bg-destructive/10/50">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-destructive" />
        <p className="text-sm font-bold text-destructive">{title}</p>
        {message && (
          <p className="text-xs text-destructive/80 mt-1 break-words">{message}</p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function NotFoundView({
  title = "No encontrado",
  description = "El recurso que buscas no existe o fue removido.",
  onBack,
  backLabel = "Volver",
}: {
  title?: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-10 text-center">
      <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-bold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> {backLabel}
        </Button>
      )}
    </div>
  );
}
