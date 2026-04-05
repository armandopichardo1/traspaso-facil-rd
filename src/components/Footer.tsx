const Footer = () => (
  <footer className="bg-primary text-primary-foreground py-12">
    <div className="container max-w-5xl">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div>
          <a href="/" className="text-xl font-extrabold">
            TRASPASA<span className="text-teal">.DO</span>
          </a>
          <p className="text-sm text-primary-foreground/60 mt-3">
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
          <h4 className="font-bold mb-3 text-sm">Síguenos</h4>
          <div className="space-y-2 text-sm text-primary-foreground/60">
            <a href="#" className="block hover:text-primary-foreground transition-colors">Instagram</a>
            <a href="#" className="block hover:text-primary-foreground transition-colors">Facebook</a>
            <a href="#" className="block hover:text-primary-foreground transition-colors">TikTok</a>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/40 space-y-1">
        <p>© 2026 TRASPASA.DO S.R.L. — Santo Domingo, República Dominicana</p>
        <p>Inspirado en los modelos de Autofact (Chile) y CHAMP Titles (EE.UU.)</p>
      </div>
    </div>
  </footer>
);

export default Footer;
