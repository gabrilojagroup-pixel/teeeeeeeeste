import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Copy, Share2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const commissionLevels = [
  { level: 1, percentage: 25, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { level: 2, percentage: 3, color: "text-violet-500", bg: "bg-violet-500/10" },
  { level: 3, percentage: 2, color: "text-primary", bg: "bg-primary/10" },
];

const AffiliatesTab = () => {
  const { profile, user } = useAuth();

  const { data: referrals } = useQuery({
    queryKey: ["referrals-list", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("referred_by", profile!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const { data: commissions } = useQuery({
    queryKey: ["commissions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("beneficiary_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const totalCommissions = commissions?.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  ) || 0;

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado!");
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "InvestFutura",
        text: "Comece a investir e ganhar dinheiro!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Programa de Afiliados</h1>
        <p className="text-muted-foreground text-sm">
          Ganhe comissões indicando amigos
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-xl p-5 border border-primary/30">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground mb-1">Seu código de indicação</p>
          <p className="text-2xl font-bold text-foreground tracking-wider">
            {profile?.referral_code}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
          <Button variant="gradient" className="flex-1" onClick={shareLink}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Commission Levels */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Níveis de Comissão
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {commissionLevels.map((level) => (
            <div
              key={level.level}
              className={`${level.bg} rounded-xl p-4 text-center border border-border`}
            >
              <Award className={`w-6 h-6 ${level.color} mx-auto mb-2`} />
              <p className="text-xs text-muted-foreground">Nível {level.level}</p>
              <p className={`text-2xl font-bold ${level.color}`}>
                {level.percentage}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Indicados</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {referrals?.length || 0}
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Ganho</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            R$ {totalCommissions.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Referrals List */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Seus Indicados
        </h2>

        {referrals && referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.map((referral: any) => (
              <div
                key={referral.id}
                className="bg-card rounded-xl p-4 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {referral.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nível 1 • {new Date(referral.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Você ainda não indicou ninguém
            </p>
            <p className="text-sm text-primary mt-1">
              Compartilhe seu link e comece a ganhar!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliatesTab;
