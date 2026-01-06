import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, Copy, Clock, CheckCircle, XCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const depositAmounts = [50, 100, 200, 500, 1000, 2000];

const DepositTab = () => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ code: string; image?: string } | null>(null);

  const { data: deposits, refetch: refetchDeposits } = useQuery({
    queryKey: ["deposits", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("type", "deposit")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const handleDeposit = async () => {
    if (!user) return;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 50) {
      toast.error("Valor mínimo de depósito: R$ 50,00");
      return;
    }

    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-pix-deposit', {
        body: {
          amount: depositAmount,
          name: profile?.full_name || 'Cliente',
          email: user.email,
          phone: profile?.phone || '(11) 99999-9999',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      setPixData({
        code: data.pix.code,
        image: data.pix.image || data.pix.base64,
      });
      
      await refetchDeposits();
      toast.success("PIX gerado com sucesso!");
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || "Erro ao criar depósito");
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixData?.code) {
      navigator.clipboard.writeText(pixData.code);
      toast.success("Código PIX copiado!");
    }
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

  if (pixData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Depósito PIX</h1>
          <p className="text-muted-foreground text-sm">
            Transfira R$ {parseFloat(amount).toFixed(2)} via PIX
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border text-center">
          {pixData.image && (
            <div className="mb-4">
              <img 
                src={pixData.image} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>
          )}

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </div>

          <p className="text-sm text-muted-foreground mb-2">Código PIX Copia e Cola</p>
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-xs font-mono text-foreground break-all max-h-20 overflow-y-auto">
              {pixData.code}
            </p>
          </div>

          <Button variant="outline" className="w-full mb-4" onClick={copyPix}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Código PIX
          </Button>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-500 font-medium mb-1">⚠️ Importante</p>
            <p className="text-xs text-muted-foreground">
              Após o pagamento, seu depósito será creditado automaticamente em sua conta.
              O prazo pode ser de alguns segundos até 5 minutos.
            </p>
          </div>
        </div>

        <Button
          variant="gradient"
          className="w-full"
          onClick={() => {
            setPixData(null);
            setAmount("");
            refetchDeposits();
          }}
        >
          Fazer Novo Depósito
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Depositar</h1>
        <p className="text-muted-foreground text-sm">
          Adicione saldo via PIX instantâneo
        </p>
      </div>

      {/* Quick Amounts */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Valores sugeridos</p>
        <div className="grid grid-cols-3 gap-3">
          {depositAmounts.map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value.toString())}
              className={`p-3 rounded-xl border text-center transition-colors ${
                amount === value.toString()
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              <span className="font-semibold">R$ {value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">
          Ou digite um valor
        </label>
        <Input
          type="number"
          placeholder="Mínimo R$ 50,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 text-lg"
        />
      </div>

      <Button
        variant="gradient"
        className="w-full"
        onClick={handleDeposit}
        disabled={loading || !amount}
      >
        {loading ? "Gerando PIX..." : "Gerar PIX"}
      </Button>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Histórico de Depósitos
        </h2>

        {deposits && deposits.length > 0 ? (
          <div className="space-y-3">
            {deposits.map((deposit: any) => (
              <div
                key={deposit.id}
                className="bg-card rounded-xl p-4 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      R$ {Number(deposit.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deposit.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deposit.status)}
                  <span className="text-sm text-muted-foreground">
                    {getStatusText(deposit.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <ArrowDownCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Você ainda não fez nenhum depósito
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositTab;
