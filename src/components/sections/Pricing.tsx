import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowRight, Sparkles } from "lucide-react";

const features = [
  "Acesso completo a todos os módulos",
  "Atualizações gratuitas vitalícias",
  "Comunidade exclusiva de alunos",
  "Suporte prioritário por 1 ano",
  "Materiais complementares em PDF",
  "Certificado de conclusão",
  "Bônus exclusivos",
  "Garantia de 7 dias"
];

const Pricing = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, hsl(45 80% 50% / 0.1) 0%, transparent 60%)"
        }}
      />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-semibold tracking-wider uppercase mb-4 block">
            Investimento
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Comece Sua <span className="text-gradient-gold">Transformação</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Um investimento único para mudar sua vida para sempre.
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative p-1 rounded-3xl bg-gradient-gold">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-gold shadow-lg">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-bold text-primary-foreground">OFERTA ESPECIAL</span>
              </div>
            </div>

            <div className="p-8 md:p-10 rounded-[22px] bg-card">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-display font-bold text-center mb-2">
                Acesso Completo
              </h3>
              <p className="text-muted-foreground text-center mb-8">
                Tudo que você precisa em um só lugar
              </p>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-muted-foreground line-through text-xl">R$ 997</span>
                </div>
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl font-medium text-gold">12x de</span>
                  <span className="text-6xl font-display font-bold text-gradient-gold mx-2">R$ 49</span>
                </div>
                <p className="text-muted-foreground mt-2">
                  ou R$ 497 à vista
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-gold" />
                    </div>
                    <span className="text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button variant="hero" size="xl" className="w-full group">
                Quero Garantir Minha Vaga
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Trust Text */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                🔒 Pagamento 100% seguro • Garantia de 7 dias
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;