import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Phone, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import DecorativeLines from "@/components/DecorativeLines";

const benefits = [
  { icon: CheckCircle, text: "Rendimento diário de 2%" },
  { icon: CheckCircle, text: "Saques ilimitados e instantâneos" },
  { icon: CheckCircle, text: "Ganhe 10% por indicação" },
  { icon: CheckCircle, text: "Plataforma 100% segura" },
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    referralCode: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register:", formData);
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 py-8">
      <DecorativeLines />
      
      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left Side - Info */}
        <div className="hidden lg:block space-y-8">
          <Logo size="lg" />
          
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight">
              Comece a investir{" "}
              <span className="text-gradient-purple">com segurança</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Ganhe até 2% ao dia com rendimentos automáticos e saques instantâneos.
            </p>
          </div>

          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <benefit.icon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit.text}</span>
              </li>
            ))}
          </ul>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-secondary">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              15,847 investidores ativos
            </span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <Logo />
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Criar Conta
              </h2>
              <p className="text-muted-foreground mt-1">
                Preencha seus dados para começar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referralCode">Código de Indicação (Opcional)</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="referralCode"
                    name="referralCode"
                    placeholder="Ex: FUT1A2B3C"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="gradient" size="lg" className="w-full mt-2">
                Criar Conta Grátis
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Já tem uma conta?{" "}
              <Link to="/" className="text-primary font-semibold hover:underline">
                Fazer Login
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Ao se cadastrar, você concorda com nossos{" "}
              <a href="#" className="underline hover:text-foreground">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="#" className="underline hover:text-foreground">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;