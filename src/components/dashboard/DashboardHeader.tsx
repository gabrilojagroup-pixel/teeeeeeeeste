import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {profile?.full_name?.split(" ")[0] || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.referral_code}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
