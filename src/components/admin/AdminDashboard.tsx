import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, ArrowUpCircle, ArrowDownCircle, DollarSign, Package } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { data: activeInvestments },
        { data: pendingWithdrawals },
        { data: pendingDeposits },
        { data: allProfiles },
        { data: todayDeposits },
        { data: allTransactions },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_investments").select("amount").eq("status", "active"),
        supabase.from("transactions").select("*").eq("type", "withdraw").eq("status", "pending"),
        supabase.from("transactions").select("*").eq("type", "deposit").eq("status", "pending"),
        supabase.from("profiles").select("balance, accumulated_balance"),
        supabase.from("transactions")
          .select("amount")
          .eq("type", "deposit")
          .eq("status", "approved")
          .gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("transactions").select("type, amount, status"),
      ]);

      const totalBalance = allProfiles?.reduce((sum, p) => sum + Number(p.balance), 0) || 0;
      const totalAccumulated = allProfiles?.reduce((sum, p) => sum + Number(p.accumulated_balance), 0) || 0;
      const totalInvestments = activeInvestments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const todayDepositTotal = todayDeposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      const totalDeposits = allTransactions
        ?.filter(t => t.type === "deposit" && t.status === "approved")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalWithdrawals = allTransactions
        ?.filter(t => t.type === "withdraw" && t.status === "approved")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        activePackages: activeInvestments?.length || 0,
        pendingWithdrawals: pendingWithdrawals?.length || 0,
        pendingDeposits: pendingDeposits?.length || 0,
        totalBalance,
        totalAccumulated,
        totalInvestments,
        todayDepositTotal,
        totalDeposits,
        totalWithdrawals,
      };
    },
  });

  const statCards = [
    {
      label: "Total Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pacotes Ativos",
      value: stats?.activePackages || 0,
      icon: Package,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Saques Pendentes",
      value: stats?.pendingWithdrawals || 0,
      icon: ArrowUpCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Depósitos Pendentes",
      value: stats?.pendingDeposits || 0,
      icon: ArrowDownCircle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Saldo Rendimentos (Usuários)",
      value: `R$ ${(stats?.totalAccumulated || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Saldo Indicações (Usuários)",
      value: `R$ ${(stats?.totalBalance || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Entradas (Depósitos)",
      value: `R$ ${(stats?.totalDeposits || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Entradas de Hoje",
      value: `R$ ${(stats?.todayDepositTotal || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Saídas (Saques)",
      value: `R$ ${(stats?.totalWithdrawals || 0).toFixed(2)}`,
      icon: ArrowUpCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
