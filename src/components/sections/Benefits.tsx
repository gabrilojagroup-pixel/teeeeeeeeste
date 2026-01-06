import { motion } from "framer-motion";
import { TrendingUp, Shield, Clock, Zap, Target, Award } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Resultados Comprovados",
    description: "Método testado e aprovado por milhares de alunos com resultados reais."
  },
  {
    icon: Shield,
    title: "Garantia Total",
    description: "7 dias de garantia incondicional. Se não gostar, devolvemos 100% do seu dinheiro."
  },
  {
    icon: Clock,
    title: "Acesso Vitalício",
    description: "Compre uma vez e tenha acesso para sempre, incluindo todas as atualizações."
  },
  {
    icon: Zap,
    title: "Resultados Rápidos",
    description: "Veja resultados já nas primeiras semanas aplicando nosso método."
  },
  {
    icon: Target,
    title: "Passo a Passo",
    description: "Conteúdo didático e organizado do básico ao avançado."
  },
  {
    icon: Award,
    title: "Certificado",
    description: "Receba um certificado de conclusão ao finalizar o treinamento."
  }
];

const Benefits = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at 80% 50%, hsl(45 80% 50% / 0.1) 0%, transparent 50%)"
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
            Por que nos escolher
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Benefícios <span className="text-gradient-gold">Exclusivos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo que você precisa para alcançar seus objetivos em um só lugar.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;