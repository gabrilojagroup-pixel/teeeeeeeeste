import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, ArrowUpCircle, ArrowDownCircle, DollarSign, Package, Wallet, RefreshCw, Send, Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Process daily returns mutation
  const processReturnsMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke("process-daily-returns");
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Rendimentos Processados!",
        description: `${data.processedReturns} rendimentos creditados, ${data.completedInvestments} investimentos finalizados.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stats query
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

  // Gateway balance query
  const { data: gatewayBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["gateway-balance"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("get-gateway-balance");
      
      if (response.error) {
        console.error("Gateway balance error:", response.error);
        return { balance: null, error: response.error.message };
      }
      
      return response.data;
    },
    refetchInterval: 60000,
  });

  // PIX transfers history query
  const { data: pixTransfers } = useQuery({
    queryKey: ["pix-transfers-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, pix_key, status, updated_at, user_id")
        .eq("type", "withdraw")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Returns history query - grouped by date
  const { data: returnsHistory } = useQuery({
    queryKey: ["returns-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, created_at, user_id")
        .eq("type", "return")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Group by date
      const grouped: Record<string, { count: number; total: number; date: string }> = {};
      
      data?.forEach((t) => {
        const date = format(new Date(t.created_at), "yyyy-MM-dd");
        if (!grouped[date]) {
          grouped[date] = { count: 0, total: 0, date };
        }
        grouped[date].count += 1;
        grouped[date].total += Number(t.amount);
      });

      return Object.values(grouped).slice(0, 10);
    },
  });

  const statCards = [
    { label: "Total Usuários", value: stats?.totalUsers || 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pacotes Ativos", value: stats?.activePackages || 0, icon: Package, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Saques Pendentes", value: stats?.pendingWithdrawals || 0, icon: ArrowUpCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Depósitos Pendentes", value: stats?.pendingDeposits || 0, icon: ArrowDownCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Saldo Rendimentos (Usuários)", value: `R$ ${(stats?.totalAccumulated || 0).toFixed(2)}`, icon: DollarSign, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Saldo Indicações (Usuários)", value: `R$ ${(stats?.totalBalance || 0).toFixed(2)}`, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Entradas (Depósitos)", value: `R$ ${(stats?.totalDeposits || 0).toFixed(2)}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Entradas de Hoje", value: `R$ ${(stats?.todayDepositTotal || 0).toFixed(2)}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total Saídas (Saques)", value: `R$ ${(stats?.totalWithdrawals || 0).toFixed(2)}`, icon: ArrowUpCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Action Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gateway Balance Card */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-6 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Gateway PoseidonPay</p>
                {isLoadingBalance ? (
                  <p className="text-2xl font-bold text-primary animate-pulse">Carregando...</p>
                ) : gatewayBalance?.error ? (
                  <p className="text-lg font-semibold text-destructive">Erro ao carregar</p>
                ) : (
                  <p className="text-3xl font-bold text-primary">R$ {(gatewayBalance?.balance || 0).toFixed(2)}</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchBalance()} disabled={isLoadingBalance}>
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Process Daily Returns Card */}
        <div className="bg-gradient-to-r from-green-500/20 to-green-500/5 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processar Rendimentos</p>
                <p className="text-lg font-semibold text-green-500">Creditar rendimentos diários</p>
                <p className="text-xs text-muted-foreground">Executa a cada 24h automaticamente</p>
              </div>
            </div>
            <Button 
              onClick={() => processReturnsMutation.mutate()} 
              disabled={processReturnsMutation.isPending}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {processReturnsMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Processar Agora
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PIX Transfers History */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Send className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Últimas Transferências PIX Enviadas</h2>
        </div>
        {pixTransfers && pixTransfers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Data</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Valor</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Chave PIX</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pixTransfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-border/50">
                    <td className="py-3">{format(new Date(transfer.updated_at), "dd/MM/yyyy HH:mm")}</td>
                    <td className="py-3 font-semibold text-green-500">R$ {Number(transfer.amount).toFixed(2)}</td>
                    <td className="py-3 text-muted-foreground truncate max-w-[200px]">{transfer.pix_key || "-"}</td>
                    <td className="py-3"><span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs">Enviado</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Nenhuma transferência PIX encontrada</p>
        )}
      </div>

      {/* Returns History */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold">Histórico de Rendimentos Processados</h2>
        </div>
        {returnsHistory && returnsHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Data</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Quantidade</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Total Creditado</th>
                </tr>
              </thead>
              <tbody>
                {returnsHistory.map((day) => (
                  <tr key={day.date} className="border-b border-border/50">
                    <td className="py-3">{format(new Date(day.date), "dd/MM/yyyy")}</td>
                    <td className="py-3 font-semibold">{day.count} rendimento(s)</td>
                    <td className="py-3 font-semibold text-green-500">R$ {day.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Nenhum rendimento processado ainda</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
