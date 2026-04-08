import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Historial Vehicular", href: "#historial" },
    { label: "Traspasos", href: "#como-funciona" },
    { label: "Para Dealers", href: "#dealers" },
    { label: "Preguntas", href: "#faq" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>
            <span className="text-primary">TRASPASA</span>
            <span className="text-teal">.DO</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="/app/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Iniciar Sesión
          </a>
          <Button variant="cta" asChild>
            <a href="#solicitud">Iniciar Traspaso</a>
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menú">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3 animate-fade-in">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
              {l.label}
            </a>
          ))}
          <a href="/app/login" onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
            Iniciar Sesión
          </a>
          <Button variant="cta" className="w-full" asChild>
            <a href="#solicitud" onClick={() => setOpen(false)}>Iniciar Traspaso</a>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
