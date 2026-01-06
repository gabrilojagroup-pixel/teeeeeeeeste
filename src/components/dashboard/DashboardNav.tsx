import { Home, TrendingUp, Users, Gift, ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";
import { TabType } from "@/pages/Dashboard";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "plans", label: "Planos", icon: TrendingUp },
  { id: "affiliates", label: "Afiliados", icon: Users },
  { id: "checkin", label: "Check-in", icon: Gift },
  { id: "history", label: "Histórico", icon: History },
  { id: "deposit", label: "Depositar", icon: ArrowDownCircle },
  { id: "withdraw", label: "Sacar", icon: ArrowUpCircle },
];

const DashboardNav = ({ activeTab, setActiveTab }: DashboardNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                activeTab === item.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
