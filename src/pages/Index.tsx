import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import Benefits from "@/components/sections/Benefits";
import Testimonials from "@/components/sections/Testimonials";
import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <section id="beneficios">
          <Benefits />
        </section>
        <section id="depoimentos">
          <Testimonials />
        </section>
        <Pricing />
        <section id="faq">
          <FAQ />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;