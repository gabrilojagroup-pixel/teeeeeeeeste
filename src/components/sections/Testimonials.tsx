import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Empresária",
    content: "Esse método mudou completamente minha forma de ver as finanças. Em 3 meses já consegui resultados que nunca imaginei possíveis.",
    rating: 5
  },
  {
    name: "João Santos",
    role: "Profissional Liberal",
    content: "Conteúdo de altíssima qualidade. O suporte é excepcional e o método realmente funciona. Recomendo demais!",
    rating: 5
  },
  {
    name: "Ana Costa",
    role: "Empreendedora",
    content: "Finalmente encontrei um método que faz sentido e que eu consigo aplicar no meu dia a dia. Os resultados são impressionantes.",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
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
            Depoimentos
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            O Que Nossos <span className="text-gradient-gold">Alunos Dizem</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Histórias reais de pessoas que transformaram suas vidas com nosso método.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative p-8 rounded-2xl bg-card border border-border group hover:border-gold/30 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6">
                <Quote className="w-8 h-8 text-gold/20" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground/90 leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;