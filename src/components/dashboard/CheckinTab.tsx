import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Calendar, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CheckinTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: checkins, refetch: refetchCheckins } = useQuery({
    queryKey: ["checkins", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user!.id)
        .order("checkin_date", { ascending: false })
        .limit(7);
      return data || [];
    },
    enabled: !!user,
  });

  const today = new Date().toISOString().split("T")[0];
  const hasCheckedInToday = checkins?.some(
    (c: any) => c.checkin_date === today
  );

  const handleCheckin = async () => {
    if (!user || !profile || hasCheckedInToday) return;

    setLoading(true);

    const { error: checkinError } = await supabase
      .from("daily_checkins")
      .insert({
        user_id: user.id,
        checkin_date: today,
        reward_amount: 1.0,
      });

    if (checkinError) {
      if (checkinError.code === "23505") {
        toast.error("Você já fez check-in hoje!");
      } else {
        toast.error("Erro ao fazer check-in");
      }
      setLoading(false);
      return;
    }

    // Add to balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({
        balance: profile.balance + 1.0,
        last_checkin_date: today,
      })
      .eq("id", profile.id);

    if (balanceError) {
      toast.error("Erro ao atualizar saldo");
      setLoading(false);
      return;
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "checkin",
      amount: 1.0,
      status: "completed",
      description: "Bônus de check-in diário",
    });

    toast.success("Check-in realizado! +R$ 1,00");
    await refreshProfile();
    await refetchCheckins();
    setLoading(false);
  };

  const getDayName = (index: number) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return days[date.getDay()];
  };

  const getDateForDay = (index: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().split("T")[0];
  };

  const isCheckedDay = (index: number) => {
    const dateStr = getDateForDay(index);
    return checkins?.some((c: any) => c.checkin_date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Check-in Diário</h1>
        <p className="text-muted-foreground text-sm">
          Ganhe R$ 1,00 por dia ao fazer check-in
        </p>
      </div>

      {/* Main Checkin Button */}
      <div className="bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-2xl p-8 border border-primary/30 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          {hasCheckedInToday ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <Gift className="w-10 h-10 text-primary" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {hasCheckedInToday ? "Check-in Feito!" : "Ganhe R$ 1,00"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {hasCheckedInToday
            ? "Volte amanhã para mais!"
            : "Faça seu check-in diário agora"}
        </p>

        <Button
          variant="gradient"
          size="lg"
          className="w-full max-w-xs"
          onClick={handleCheckin}
          disabled={loading || hasCheckedInToday}
        >
          {loading ? (
            "Processando..."
          ) : hasCheckedInToday ? (
            <>
              <Clock className="w-5 h-5 mr-2" />
              Volte Amanhã
            </>
          ) : (
            <>
              <Gift className="w-5 h-5 mr-2" />
              Fazer Check-in
            </>
          )}
        </Button>
      </div>

      {/* Week Calendar */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Últimos 7 dias
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const isToday = index === 6;
            const isChecked = isCheckedDay(index);

            return (
              <div
                key={index}
                className={`rounded-xl p-3 text-center border ${
                  isToday
                    ? "border-primary bg-primary/10"
                    : isChecked
                    ? "border-green-500 bg-green-500/10"
                    : "border-border bg-card"
                }`}
              >
                <p className="text-[10px] text-muted-foreground mb-1">
                  {getDayName(index)}
                </p>
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    isChecked
                      ? "bg-green-500 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          Como funciona?
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Faça check-in uma vez por dia</li>
          <li>• Cada check-in adiciona R$ 1,00 ao seu saldo</li>
          <li>• O check-in é liberado a cada 24 horas</li>
          <li>• Mantenha uma sequência para bônus extras!</li>
        </ul>
      </div>
    </div>
  );
};

export default CheckinTab;
