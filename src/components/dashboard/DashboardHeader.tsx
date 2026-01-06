import { useAuth } from "@/hooks/useAuth";
import { LogOut, Bell } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DashboardHeader = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        
        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <p className="text-sm font-medium text-foreground truncate max-w-[100px]">
              {profile?.full_name?.split(" ")[0] || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.referral_code}
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="p-3 border-b border-border">
                <h4 className="font-semibold text-sm">Notificações</h4>
              </div>
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            </PopoverContent>
          </Popover>
          
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
