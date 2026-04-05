import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/18091234567?text=Hola%2C%20quiero%20info%20sobre%20TRASPASA.DO"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-cta-foreground flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
    aria-label="Contactar por WhatsApp"
  >
    <MessageCircle size={28} />
  </a>
);

export default WhatsAppButton;
