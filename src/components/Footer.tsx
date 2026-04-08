import { Shield, Instagram, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground py-12">
    <div className="container max-w-5xl">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-1">
          <a href="/" className="flex items-center gap-2 text-xl font-extrabold mb-3">
            <div className="w-7 h-7 rounded-md bg-primary-foreground/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <span>TRASPASA<span className="text-teal">.DO</span></span>
          </a>
          <p className="text-sm text-primary-foreground/60">
            La primera plataforma digital de traspasos vehiculares en República Dominicana
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">Enlaces</h4>
          <div className="space-y-2 text-sm text-primary-foreground/60">
            <a href="#historial" className="block hover:text-primary-foreground transition-colors">Historial</a>
            <a href="#como-funciona" className="block hover:text-primary-foreground transition-colors">Traspasos</a>
            <a href="#dealers" className="block hover:text-primary-foreground transition-colors">Dealers</a>
            <a href="#gestores" className="block hover:text-primary-foreground transition-colors">Gestores</a>
            <a href="#faq" className="block hover:text-primary-foreground transition-colors">Preguntas</a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">Legal</h4>
          <div className="space-y-2 text-sm text-primary-foreground/60">
            <a href="/terminos" className="block hover:text-primary-foreground transition-colors">Términos de Servicio</a>
            <a href="/privacidad" className="block hover:text-primary-foreground transition-colors">Política de Privacidad</a>
            <a href="#" className="block hover:text-primary-foreground transition-colors">Aviso Legal</a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3 text-sm">Síguenos</h4>
          <div className="flex gap-3 mb-4">
            <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
          <div className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-3 mt-3">
            <p className="text-xs text-primary-foreground/60 font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-accent" />
              Certificado por Notarios RD
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/40 space-y-1">
        <p>© 2026 TRASPASA.DO S.R.L. · RNC: 1-32-XXXXX-X · Santo Domingo, República Dominicana</p>
        <p>Inspirado en los modelos de Autofact (Chile) y CHAMP Titles (EE.UU.)</p>
      </div>
    </div>
  </footer>
);

export default Footer;
