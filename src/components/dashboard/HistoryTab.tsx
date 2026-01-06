import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, TrendingUp, Gift, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  deposit: { label: "Depósito", icon: ArrowDownCircle, color: "text-green-500" },
  withdraw: { label: "Saque", icon: ArrowUpCircle, color: "text-red-500" },
  transfer: { label: "Transferência", icon: RefreshCw, color: "text-blue-500" },
  investment: { label: "Investimento", icon: TrendingUp, color: "text-primary" },
  daily_return: { label: "Rendimento", icon: TrendingUp, color: "text-green-500" },
  checkin: { label: "Check-in", icon: Gift, color: "text-yellow-500" },
  commission: { label: "Comissão", icon: Award, color: "text-violet-500" },
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pendente", bg: "bg-yellow-500/10", text: "text-yellow-500" },
  approved: { label: "Aprovado", bg: "bg-green-500/10", text: "text-green-500" },
  rejected: { label: "Rejeitado", bg: "bg-red-500/10", text: "text-red-500" },
  completed: { label: "Concluído", bg: "bg-green-500/10", text: "text-green-500" },
};

const HistoryTab = () => {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["user-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Histórico de Transações</h1>
        <p className="text-muted-foreground text-sm">
          Todas as suas movimentações
        </p>
      </div>

      {transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const config = typeConfig[tx.type] || typeConfig.deposit;
            const status = statusConfig[tx.status || "pending"];
            const Icon = config.icon;

            return (
              <div
                key={tx.id}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${config.color.replace("text-", "bg-")}/10 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {config.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {tx.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === "withdraw" ? "text-red-500" : "text-green-500"}`}>
                      {tx.type === "withdraw" ? "-" : "+"}R$ {Number(tx.amount).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Nenhuma transação ainda
          </p>
          <p className="text-sm text-primary mt-1">
            Faça seu primeiro depósito!
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
