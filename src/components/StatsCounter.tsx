import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 6600000, display: "6.6M+", label: "Vehículos en RD" },
  { value: 150000, display: "150K+", label: "Traspasos por año" },
  { value: 0, display: "0", label: "Plataformas digitales (hasta ahora)" },
];

function AnimatedCounter({ value, display, label }: { value: number; display: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (value === 0) { setCount(0); return; }

    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, Math.round(increment * step));
      setCount(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  const formatCount = (n: number) => {
    if (value === 0) return "0";
    if (value >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (value >= 1_000) return `${Math.round(n / 1_000)}K+`;
    return n.toLocaleString("es-DO");
  };

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <p className="text-3xl md:text-5xl font-extrabold text-accent">{formatCount(count)}</p>
      <p className="text-sm md:text-base text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

const StatsCounter = () => (
  <section className="py-10 md:py-14 bg-background">
    <div className="container max-w-4xl">
      <div className="grid grid-cols-3 gap-6">
        {stats.map((s) => (
          <AnimatedCounter key={s.label} {...s} />
        ))}
      </div>
    </div>
  </section>
);

export default StatsCounter;
