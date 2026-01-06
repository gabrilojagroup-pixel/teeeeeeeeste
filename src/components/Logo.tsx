import { Sparkles } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const Logo = ({ size = "md" }: LogoProps) => {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-xl" },
    md: { icon: "w-10 h-10", text: "text-2xl" },
    lg: { icon: "w-12 h-12", text: "text-3xl" },
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size].icon} rounded-xl bg-gradient-purple flex items-center justify-center`}>
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </div>
      <span className={`${sizes[size].text} font-bold text-gradient-purple`}>
        InvestFutura
      </span>
    </div>
  );
};

export default Logo;