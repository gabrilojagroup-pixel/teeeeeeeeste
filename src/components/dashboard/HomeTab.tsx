import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, PiggyBank, TrendingUp, Users, ArrowRightLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
const HomeTab = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { data: investments } = useQuery({
    queryKey: ["user-investments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_investments")
        .select("*, investment_plans(*)")
        .eq("user_id", user!.id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: referrals } = useQuery({
    queryKey: ["referrals", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("referred_by", profile!.id);
      return data || [];
    },
    enabled: !!profile,
  });

  const totalInvested = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    const maxAmount = profile?.accumulated_balance || 0;

    if (isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    if (amount > maxAmount) {
      toast.error("Valor maior que o saldo acumulado disponível");
      return;
    }

    setIsTransferring(true);

    try {
      // Update balances
      const newAccumulated = maxAmount - amount;
      const newBalance = (profile?.balance || 0) + amount;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          accumulated_balance: newAccumulated,
          balance: newBalance,
        })
        .eq("user_id", user?.id);

      if (updateError) throw updateError;

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user?.id,
        type: "transfer",
        amount: amount,
        status: "completed",
        description: "Transferência de saldo acumulado para disponível",
      });

      toast.success(`R$ ${amount.toFixed(2)} transferido com sucesso!`);
      setShowTransferDialog(false);
      setTransferAmount("");
      await refreshProfile();
    } catch (error: any) {
      toast.error("Erro ao transferir: " + error.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const setMaxAmount = () => {
    setTransferAmount(String(profile?.accumulated_balance || 0));
  };
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">
          Olá, {profile?.full_name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe seus investimentos
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Saldo Disponível</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            R$ {profile?.balance?.toFixed(2) || "0.00"}
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Saldo Acumulado</span>
          </div>
          <p className="text-xl font-bold text-green-500">
            R$ {profile?.accumulated_balance?.toFixed(2) || "0.00"}
          </p>
          {(profile?.accumulated_balance || 0) > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 text-xs h-8"
              onClick={() => setShowTransferDialog(true)}
            >
              <ArrowRightLeft className="w-3 h-3 mr-1" />
              Transferir
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Investido</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            R$ {totalInvested.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {investments?.length || 0} investimento(s) ativo(s)
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 rounded-xl p-4 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">Indicados</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {referrals?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground">
            pessoas indicadas
          </p>
        </div>
      </div>

      {/* Active Investments */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Investimentos Ativos
        </h2>
        
        {investments && investments.length > 0 ? (
          <div className="space-y-3">
            {investments.map((inv: any) => (
              <div
                key={inv.id}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {inv.investment_plans?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R$ {Number(inv.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-500">
                      +R$ {Number(inv.daily_return).toFixed(2)}/dia
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.investment_plans?.daily_return_percentage}% ao dia
                    </p>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-3">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: "30%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Você ainda não tem investimentos ativos
            </p>
            <p className="text-sm text-primary mt-1">
              Vá para a aba "Planos" para começar!
            </p>
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Saldo</DialogTitle>
            <DialogDescription>
              Transfira seu saldo acumulado para o saldo disponível
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Saldo Acumulado:</span>
                <span className="text-green-500 font-medium">
                  R$ {profile?.accumulated_balance?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo Disponível:</span>
                <span className="text-foreground font-medium">
                  R$ {profile?.balance?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Valor a transferir
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="h-12"
                  max={profile?.accumulated_balance || 0}
                />
                <Button
                  variant="outline"
                  onClick={setMaxAmount}
                  className="h-12 px-4"
                >
                  MAX
                </Button>
              </div>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={handleTransfer}
              disabled={isTransferring || !transferAmount}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Confirmar Transferência
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeTab;
