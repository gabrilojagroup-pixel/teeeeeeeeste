import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpCircle, Wallet, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Função para validar CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
};

// Formatar CPF enquanto digita
const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
};

const WithdrawTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cpfLoaded, setCpfLoaded] = useState(false);

  // Load CPF from profile on mount
  useState(() => {
    if (profile?.cpf && !cpfLoaded) {
      setCpf(formatCPF(profile.cpf));
      setCpfLoaded(true);
    }
  });

  // Update CPF when profile loads
  if (profile?.cpf && !cpfLoaded) {
    setCpf(formatCPF(profile.cpf));
    setCpfLoaded(true);
  }

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

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
    
    const cleanCPF = value.replace(/\D/g, '');
    if (cleanCPF.length === 11) {
      if (!validateCPF(cleanCPF)) {
        setCpfError("CPF inválido");
      } else {
        setCpfError("");
      }
    } else {
      setCpfError("");
    }
  };

  const handleWithdraw = async () => {
    if (!user || !profile) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 30) {
      toast.error("Valor mínimo de saque: R$ 30,00");
      return;
    }

    if (withdrawAmount > (profile.balance || 0)) {
      toast.error("Saldo insuficiente");
      return;
    }

    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX");
      return;
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    if (!cleanCPF || cleanCPF.length !== 11) {
      toast.error("Informe seu CPF");
      return;
    }

    if (!validateCPF(cleanCPF)) {
      toast.error("CPF inválido");
      return;
    }

    setLoading(true);

    try {
      // Save CPF to profile if not already saved
      if (!profile.cpf || profile.cpf !== cleanCPF) {
        await supabase
          .from('profiles')
          .update({ cpf: cleanCPF })
          .eq('id', profile.id);
      }

      const response = await supabase.functions.invoke('create-pix-withdraw', {
        body: {
          amount: withdrawAmount,
          pixKey: pixKey.trim(),
          name: profile.full_name,
          document: cpf,
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

      toast.success("Saque solicitado! Será processado automaticamente.");
      await refreshProfile();
      await refetchWithdrawals();
      setAmount("");
      setPixKey("");
      setCpf("");
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast.error(error.message || "Erro ao solicitar saque");
    } finally {
      setLoading(false);
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
        return "Processando";
    }
  };

  const isFormValid = amount && pixKey && cpf.replace(/\D/g, '').length === 11 && !cpfError;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Sacar</h1>
        <p className="text-muted-foreground text-sm">
          Retire seu saldo via PIX automático
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
            placeholder="Mínimo R$ 30,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            CPF do titular da conta
          </label>
          <Input
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            className={`h-12 ${cpfError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            maxLength={14}
          />
          {cpfError && (
            <p className="text-xs text-red-500 mt-1">{cpfError}</p>
          )}
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
          disabled={loading || !isFormValid}
        >
          {loading ? "Processando..." : "Solicitar Saque"}
        </Button>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          ⚡ <strong>PIX Automático:</strong> Saques são processados automaticamente via API.
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
