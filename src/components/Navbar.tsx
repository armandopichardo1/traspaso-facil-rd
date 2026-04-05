import { useState } from "react";
import { Menu, X } from "lucide-react";
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
        <a href="/" className="flex items-center gap-0 text-xl font-extrabold tracking-tight">
          <span className="text-primary">TRASPASA</span>
          <span className="text-teal">.DO</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Button variant="cta" asChild>
            <a href="#solicitud">Iniciar Traspaso</a>
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menú">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">
              {l.label}
            </a>
          ))}
          <Button variant="cta" className="w-full" asChild>
            <a href="#solicitud" onClick={() => setOpen(false)}>Iniciar Traspaso</a>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
