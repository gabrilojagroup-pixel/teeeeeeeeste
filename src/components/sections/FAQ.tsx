import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Quanto tempo tenho acesso ao conteúdo?",
    answer: "Você terá acesso vitalício! Isso significa que pode acessar o conteúdo quando quiser, pelo tempo que quiser, incluindo todas as atualizações futuras."
  },
  {
    question: "E se eu não gostar do curso?",
    answer: "Oferecemos garantia incondicional de 7 dias. Se por qualquer motivo você não ficar satisfeito, basta solicitar o reembolso e devolveremos 100% do seu investimento, sem perguntas."
  },
  {
    question: "Preciso de conhecimento prévio?",
    answer: "Não! O curso foi desenvolvido para atender tanto iniciantes quanto pessoas mais experientes. Começamos do básico e avançamos gradualmente."
  },
  {
    question: "Como funciona o suporte?",
    answer: "Você terá acesso a suporte prioritário por 1 ano através da nossa comunidade exclusiva e também por e-mail. Nossa equipe está sempre pronta para ajudar."
  },
  {
    question: "Posso parcelar o pagamento?",
    answer: "Sim! Você pode parcelar em até 12x no cartão de crédito. Também aceitamos PIX e boleto bancário para pagamento à vista com desconto."
  },
  {
    question: "Quando recebo os bônus?",
    answer: "Todos os bônus são liberados imediatamente após a confirmação do pagamento, junto com o acesso completo ao curso."
  }
];

const FAQ = () => {
  return (
    <section className="py-24 relative overflow-hidden">
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
            FAQ
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Perguntas <span className="text-gradient-gold">Frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre nosso método e como funciona.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl px-6 bg-card hover:border-gold/30 transition-colors duration-300"
              >
                <AccordionTrigger className="text-left font-semibold hover:text-gold transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;