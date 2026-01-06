import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  Settings, 
  Target,
  Network,
  LogOut,
  Shield,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminTabType } from "@/pages/AdminPanel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
}

const menuItems: { id: AdminTabType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Usuários", icon: Users },
  { id: "withdrawals", label: "Saques", icon: ArrowUpCircle },
  { id: "deposits", label: "Depósitos", icon: ArrowDownCircle },
  { id: "plans", label: "Planos", icon: TrendingUp },
  { id: "affiliate", label: "Unilevel", icon: Network },
  { id: "sponsorships", label: "Patrocínios", icon: Target },
  { id: "settings", label: "Configurações", icon: Settings },
];

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const { signOut } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-purple rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground">Painel de Controle</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="font-medium truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-purple rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <p className="font-bold text-foreground">Admin</p>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <div className="min-h-screen flex flex-col">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border min-h-screen flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;