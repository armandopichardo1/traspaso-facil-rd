import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 6600000, display: "6.6M+", label: "Vehículos en RD" },
  { value: 150000, display: "150K+", label: "Traspasos por año" },
  { value: 1, display: "1", label: "Plataforma digital", highlight: true },
];

function AnimatedCounter({ value, display, label, highlight }: { value: number; display: string; label: string; highlight?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    if (highlight) {
      // Show "0" first, then after a delay flip to "1" with effect
      setCount(0);
      const timer = setTimeout(() => {
        setCount(1);
        setShowHighlight(true);
      }, 1200);
      return () => clearTimeout(timer);
    }

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
  }, [isInView, value, highlight]);

  const formatCount = (n: number) => {
    if (highlight) return n.toString();
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
      <div className="relative inline-block">
        <motion.p
          className={`text-3xl md:text-5xl font-extrabold ${showHighlight ? "text-cta" : "text-accent"}`}
          animate={showHighlight ? { scale: [1, 1.4, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {formatCount(count)}
        </motion.p>
        {showHighlight && (
          <motion.span
            className="absolute -top-2 -right-6 text-xs font-bold text-cta"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            🎉
          </motion.span>
        )}
      </div>
      <p className="text-sm md:text-base text-muted-foreground mt-1">{label}</p>
      {showHighlight && (
        <motion.p
          className="text-xs font-bold text-cta mt-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          TRASPASA.DO 🚀
        </motion.p>
      )}
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
