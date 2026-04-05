import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Props = {
  dateFrom: string;
  dateTo: string;
  status: string;
  plan: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPlanChange: (v: string) => void;
  onClear: () => void;
};

const LeadFilters = ({ dateFrom, dateTo, status, plan, onDateFromChange, onDateToChange, onStatusChange, onPlanChange, onClear }: Props) => {
  const hasFilters = dateFrom || dateTo || status !== "todos" || plan !== "todos";

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Filtros</p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground h-7 px-2">
            <X size={12} className="mr-1" /> Limpiar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
          <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
          <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="contactado">Contactado</SelectItem>
              <SelectItem value="en_proceso">En proceso</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Plan</label>
          <Select value={plan} onValueChange={onPlanChange}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="basico">Básico</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default LeadFilters;
