import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpCircle, Wallet, Clock, CheckCircle, XCircle, User, Phone, Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Função para validar CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
};

// Formatar CPF
const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
};

// Formatar telefone
const formatPhone = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  if (cleanValue.length <= 2) return cleanValue;
  if (cleanValue.length <= 7) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7)}`;
};

const WithdrawTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [loading, setLoading] = useState(false);
  const FEE_PERCENTAGE = 0.10; // 10% fee

  // Load data from profile
  useEffect(() => {
    if (profile) {
      if (profile.full_name && !name) setName(profile.full_name);
      if (profile.cpf && !cpf) setCpf(formatCPF(profile.cpf));
      if (profile.phone && !phone) setPhone(formatPhone(profile.phone));
    }
  }, [profile]);

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
      setCpfError(validateCPF(cleanCPF) ? "" : "CPF inválido");
    } else {
      setCpfError("");
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
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

    if (!name.trim()) {
      toast.error("Informe seu nome completo");
      return;
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    if (!cleanCPF || cleanCPF.length !== 11 || !validateCPF(cleanCPF)) {
      toast.error("Informe um CPF válido");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Informe um telefone válido");
      return;
    }

    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX");
      return;
    }

    setLoading(true);

    try {
      // Save data to profile
      await supabase
        .from('profiles')
        .update({ 
          full_name: name.trim(),
          cpf: cleanCPF,
          phone: cleanPhone 
        })
        .eq('id', profile.id);

      const response = await supabase.functions.invoke('create-pix-withdraw', {
        body: {
          amount: withdrawAmount,
          pixKey: pixKey.trim(),
          name: name.trim(),
          document: cpf,
          phone: phone,
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

  const isFormValid = amount && name.trim() && cpf.replace(/\D/g, '').length === 11 && !cpfError && phone.replace(/\D/g, '').length >= 10 && pixKey.trim();

  // Loading state
  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Processando Saque</h1>
          <p className="text-muted-foreground text-sm">Aguarde enquanto processamos seu saque...</p>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border">
          <div className="flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-primary/20 flex items-center justify-center border-2 border-violet-500/30"
            >
              <ArrowUpCircle className="w-12 h-12 text-violet-500" />
            </motion.div>

            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-8 h-8 text-violet-500" />
            </motion.div>

            <div className="space-y-3 w-full max-w-xs">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-foreground">Validando dados...</span>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-6 h-6 rounded-full bg-violet-500/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </motion.div>
                <span className="text-sm text-muted-foreground">Enviando para sua chave PIX...</span>
              </motion.div>
            </div>

            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-center mt-4">
              <p className="text-sm text-muted-foreground">Valor do saque</p>
              <p className="text-2xl font-bold text-violet-500">R$ {parseFloat(amount || "0").toFixed(2)}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Sacar</h1>
        <p className="text-muted-foreground text-sm">Retire seu saldo via PIX automático</p>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-xl p-5 border border-primary/30">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Saldo Disponível</span>
        </div>
        <p className="text-3xl font-bold text-foreground">R$ {profile?.balance?.toFixed(2) || "0.00"}</p>
      </div>

      {/* Personal Data */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <User className="w-4 h-4" />
          Dados Pessoais
        </h3>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Nome Completo</label>
          <Input
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">CPF</label>
          <Input
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            className={`h-12 ${cpfError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            maxLength={14}
          />
          {cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Telefone</label>
          <Input
            type="text"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="h-12"
            maxLength={15}
          />
        </div>
      </div>

      {/* PIX Key */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Key className="w-4 h-4" />
          Dados do Saque
        </h3>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Valor do saque</label>
          <Input
            type="number"
            placeholder="Mínimo R$ 30,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12"
          />
          {amount && parseFloat(amount) > 0 && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor solicitado:</span>
                <span className="text-foreground">R$ {parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa (10%):</span>
                <span className="text-red-500">- R$ {(parseFloat(amount) * FEE_PERCENTAGE).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-border pt-1">
                <span className="text-foreground">Você receberá:</span>
                <span className="text-green-500">R$ {(parseFloat(amount) * (1 - FEE_PERCENTAGE)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Chave PIX (CPF, E-mail, Telefone ou Aleatória)</label>
          <Input
            type="text"
            placeholder="Sua chave PIX"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className="h-12"
          />
        </div>

        <Button variant="gradient" className="w-full" onClick={handleWithdraw} disabled={loading || !isFormValid}>
          {loading ? "Processando..." : "Solicitar Saque"}
        </Button>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          ⚡ <strong>PIX Automático:</strong> Saques são processados automaticamente via API.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          💰 <strong>Taxa:</strong> 10% sobre o valor do saque.
        </p>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Histórico de Saques</h2>

        {withdrawals && withdrawals.length > 0 ? (
          <div className="space-y-3">
            {withdrawals.map((withdrawal: any) => (
              <div key={withdrawal.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <ArrowUpCircle className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">R$ {Number(withdrawal.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(withdrawal.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(withdrawal.status)}
                  <span className="text-sm text-muted-foreground">{getStatusText(withdrawal.status)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <ArrowUpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Você ainda não fez nenhum saque</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawTab;
