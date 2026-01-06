import { useState } from "react";
import { Home, TrendingUp, Users, Gift, ArrowDownCircle, ArrowUpCircle, History, MoreHorizontal, X } from "lucide-react";
import { TabType } from "@/pages/Dashboard";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const mainItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Início", icon: Home },
  { id: "plans", label: "Planos", icon: TrendingUp },
  { id: "affiliates", label: "Afiliados", icon: Users },
  { id: "deposit", label: "Depositar", icon: ArrowDownCircle },
];

const moreItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "withdraw", label: "Sacar", icon: ArrowUpCircle },
  { id: "history", label: "Histórico", icon: History },
  { id: "checkin", label: "Check-in", icon: Gift },
];

const DashboardNav = ({ activeTab, setActiveTab }: DashboardNavProps) => {
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some(item => item.id === activeTab);

  const handleSelect = (id: TabType) => {
    setActiveTab(id);
    setShowMore(false);
  };

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu popup */}
      {showMore && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto bg-card border border-border rounded-xl p-4 z-50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground">Mais opções</span>
            <button 
              onClick={() => setShowMore(false)}
              className="p-1 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {moreItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                  activeTab === item.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="max-w-lg mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
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
            
            {/* More button */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                showMore || isMoreActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default DashboardNav;
