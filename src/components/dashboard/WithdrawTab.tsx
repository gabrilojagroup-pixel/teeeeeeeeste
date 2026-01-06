import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpCircle, Wallet, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const WithdrawTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["withdrawals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const handleWithdraw = async () => {
    if (!user || !profile) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 20) {
      toast.error("Valor mínimo de saque: R$ 20,00");
      return;
    }

    if (withdrawAmount > profile.balance) {
      toast.error("Saldo insuficiente");
      return;
    }

    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX");
      return;
    }

    setLoading(true);

    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: withdrawAmount,
      status: "pending",
      pix_key: pixKey,
      description: "Saque via PIX",
    });

    if (txError) {
      toast.error("Erro ao solicitar saque");
      setLoading(false);
      return;
    }

    // Deduct from balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: profile.balance - withdrawAmount })
      .eq("id", profile.id);

    if (balanceError) {
      toast.error("Erro ao atualizar saldo");
      setLoading(false);
      return;
    }

    toast.success("Saque solicitado! Será processado em até 24h.");
    await refreshProfile();
    await refetchWithdrawals();
    setAmount("");
    setPixKey("");
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      default:
        return "Pendente";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Sacar</h1>
        <p className="text-muted-foreground text-sm">
          Retire seu saldo via PIX
        </p>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-xl p-5 border border-primary/30">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Saldo Disponível</span>
        </div>
        <p className="text-3xl font-bold text-foreground">
          R$ {profile?.balance?.toFixed(2) || "0.00"}
        </p>
      </div>

      {/* Withdraw Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Valor do saque
          </label>
          <Input
            type="number"
            placeholder="Mínimo R$ 20,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Chave PIX (CPF, E-mail, Telefone ou Aleatória)
          </label>
          <Input
            type="text"
            placeholder="Sua chave PIX"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className="h-12"
          />
        </div>

        <Button
          variant="gradient"
          className="w-full"
          onClick={handleWithdraw}
          disabled={loading || !amount || !pixKey}
        >
          {loading ? "Processando..." : "Solicitar Saque"}
        </Button>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          ⏰ <strong>Prazo:</strong> Saques são processados em até 24 horas úteis.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          💰 <strong>Taxa:</strong> Sem taxas para saques acima de R$ 50,00.
        </p>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Histórico de Saques
        </h2>

        {withdrawals && withdrawals.length > 0 ? (
          <div className="space-y-3">
            {withdrawals.map((withdrawal: any) => (
              <div
                key={withdrawal.id}
                className="bg-card rounded-xl p-4 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <ArrowUpCircle className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      R$ {Number(withdrawal.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(withdrawal.status)}
                  <span className="text-sm text-muted-foreground">
                    {getStatusText(withdrawal.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <ArrowUpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Você ainda não fez nenhum saque
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawTab;
