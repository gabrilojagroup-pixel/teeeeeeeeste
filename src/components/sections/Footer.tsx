import { Crown, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-card/50">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold text-gradient-gold">
                Gold Method
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              Transformando vidas através do conhecimento e da educação financeira de qualidade.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-gold transition-colors">Sobre Nós</a>
              </li>
              <li>
                <a href="#" className="hover:text-gold transition-colors">Área do Aluno</a>
              </li>
              <li>
                <a href="#" className="hover:text-gold transition-colors">Política de Privacidade</a>
              </li>
              <li>
                <a href="#" className="hover:text-gold transition-colors">Termos de Uso</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span>contato@goldmethod.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span>(11) 99999-9999</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>São Paulo, SP</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Gold Method. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;