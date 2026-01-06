import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import planBasic from "@/assets/plan-basic.png";
import planStarter from "@/assets/plan-starter.png";
import planSilver from "@/assets/plan-silver.png";
import planGold from "@/assets/plan-gold.png";
import planPlatinum from "@/assets/plan-platinum.png";

const planImages = [planBasic, planStarter, planSilver, planGold, planPlatinum];

const PlansTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["investment-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("investment_plans")
        .select("*")
        .eq("is_active", true)
        .order("min_amount");
      return data || [];
    },
  });

  const handleInvest = async () => {
    if (!selectedPlan || !user || !profile) return;

    const investAmount = parseFloat(amount);
    if (isNaN(investAmount) || investAmount < selectedPlan.min_amount) {
      toast.error(`Valor mínimo: R$ ${selectedPlan.min_amount}`);
      return;
    }
    if (investAmount > selectedPlan.max_amount) {
      toast.error(`Valor máximo: R$ ${selectedPlan.max_amount}`);
      return;
    }
    if (investAmount > profile.balance) {
      toast.error("Saldo insuficiente. Faça um depósito primeiro.");
      return;
    }

    setLoading(true);

    const dailyReturn = (investAmount * selectedPlan.daily_return_percentage) / 100;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

    const { error: investError } = await supabase.from("user_investments").insert({
      user_id: user.id,
      plan_id: selectedPlan.id,
      amount: investAmount,
      daily_return: dailyReturn,
      end_date: endDate.toISOString(),
    });

    if (investError) {
      toast.error("Erro ao criar investimento");
      setLoading(false);
      return;
    }

    // Deduct from balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: profile.balance - investAmount })
      .eq("id", profile.id);

    if (balanceError) {
      toast.error("Erro ao atualizar saldo");
      setLoading(false);
      return;
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "investment",
      amount: -investAmount,
      status: "completed",
      description: `Investimento no plano ${selectedPlan.name}`,
    });

    toast.success("Investimento realizado com sucesso!");
    await refreshProfile();
    setSelectedPlan(null);
    setAmount("");
    setLoading(false);
  };

  const getPlanIcon = (index: number) => {
    if (index >= 4) return <Star className="w-5 h-5 text-yellow-500" />;
    if (index >= 2) return <Zap className="w-5 h-5 text-violet-500" />;
    return <TrendingUp className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Planos de Investimento</h1>
        <p className="text-muted-foreground text-sm">
          Escolha o melhor plano para você
        </p>
      </div>

      <div className="space-y-4">
        {plans?.map((plan: any, index: number) => (
          <div
            key={plan.id}
            className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-colors overflow-hidden"
          >
            {/* Plan Image */}
            <div className="w-full h-32 rounded-lg overflow-hidden mb-4 bg-secondary/50">
              <img 
                src={planImages[index] || planBasic} 
                alt={plan.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {getPlanIcon(index)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.duration_days} dias
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-500">
                  {plan.daily_return_percentage}%
                </p>
                <p className="text-xs text-muted-foreground">ao dia</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-muted-foreground">Investimento:</span>
              <span className="text-foreground font-medium">
                R$ {plan.min_amount.toFixed(0)} - R$ {plan.max_amount.toFixed(0)}
              </span>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={() => setSelectedPlan(plan)}
            >
              Investir
            </Button>
          </div>
        ))}
      </div>

      {/* Investment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investir no plano {selectedPlan?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Rendimento diário:</span>
                <span className="text-green-500 font-medium">
                  {selectedPlan?.daily_return_percentage}%
                </span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Min - Máx:</span>
                <span className="text-foreground">
                  R$ {selectedPlan?.min_amount} - R$ {selectedPlan?.max_amount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seu saldo:</span>
                <span className="text-foreground font-medium">
                  R$ {profile?.balance?.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Valor do investimento
              </label>
              <Input
                type="number"
                placeholder={`Mínimo R$ ${selectedPlan?.min_amount}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12"
              />
            </div>

            {amount && !isNaN(parseFloat(amount)) && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Rendimento diário estimado:
                </p>
                <p className="text-2xl font-bold text-green-500">
                  R${" "}
                  {(
                    (parseFloat(amount) * selectedPlan?.daily_return_percentage) /
                    100
                  ).toFixed(2)}
                </p>
              </div>
            )}

            <Button
              variant="gradient"
              className="w-full"
              onClick={handleInvest}
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar Investimento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansTab;
