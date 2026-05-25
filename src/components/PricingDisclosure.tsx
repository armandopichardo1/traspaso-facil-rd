import { Info } from "lucide-react";

/**
 * Disclosure legal oficial de pagos a terceros.
 * USAR debajo/cerca de cualquier precio de TRASPASO mostrado al usuario.
 * No aplica al historial vehicular (es servicio propio sin pagos a terceros).
 * El texto es legal — no editar sin coordinar con KNOWLEDGE.md §4.
 */
type Props = {
  className?: string;
  variant?: "default" | "onDark";
};

const PricingDisclosure = ({ className = "", variant = "default" }: Props) => {
  const color = variant === "onDark" ? "text-white/80" : "text-muted-foreground";
  return (
    <p className={`flex items-start gap-1.5 text-xs ${color} ${className}`}>
      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>
        El impuesto del 2%, la tasa CENARVE (RD$100) y el acto notarial son pagos a terceros, gestionados a tu nombre.
      </span>
    </p>
  );
};

export default PricingDisclosure;
