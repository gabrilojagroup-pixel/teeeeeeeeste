import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownCircle, Copy, Clock, CheckCircle, XCircle, QrCode, Loader2, User, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

const depositAmounts = [30, 50, 100, 200, 500, 1000];

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

const DepositTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ code: string; image?: string } | null>(null);

  // Load data from profile
  useEffect(() => {
    if (profile) {
      if (profile.full_name && !name) setName(profile.full_name);
      if (profile.cpf && !cpf) setCpf(formatCPF(profile.cpf));
      if (profile.phone && !phone) setPhone(formatPhone(profile.phone));
    }
  }, [profile]);

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

  const handleDeposit = async () => {
    if (!user) return;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 30) {
      toast.error("Valor mínimo de depósito: R$ 30,00");
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

    setLoading(true);

    try {
      // Save data to profile
      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            full_name: name.trim(),
            cpf: cleanCPF,
            phone: cleanPhone 
          })
          .eq('id', profile.id);
        await refreshProfile();
      }

      const response = await supabase.functions.invoke('create-pix-deposit', {
        body: {
          amount: depositAmount,
          name: name.trim(),
          email: user.email,
          phone: phone,
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

  const isFormValid = amount && name.trim() && cpf.replace(/\D/g, '').length === 11 && !cpfError && phone.replace(/\D/g, '').length >= 10;

  // Loading state
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Gerando PIX</h1>
          <p className="text-muted-foreground text-sm">
            Aguarde enquanto preparamos seu pagamento...
          </p>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border">
          <div className="flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center border-2 border-primary/30"
            >
              <QrCode className="w-12 h-12 text-primary" />
            </motion.div>

            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>

            <div className="space-y-3 w-full max-w-xs">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm text-foreground">Validando dados...</span>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-6 h-6 rounded-full bg-primary/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                </motion.div>
                <span className="text-sm text-muted-foreground">Gerando QR Code PIX...</span>
              </motion.div>
            </div>

            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-center mt-4">
              <p className="text-sm text-muted-foreground">Valor do depósito</p>
              <p className="text-2xl font-bold text-primary">R$ {parseFloat(amount || "0").toFixed(2)}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  // PIX generated state
  if (pixData) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Depósito PIX</h1>
          <p className="text-muted-foreground text-sm">Transfira R$ {parseFloat(amount).toFixed(2)} via PIX</p>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 border border-border text-center">
          {pixData.image && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mb-4">
              <img src={pixData.image} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-lg shadow-lg" />
            </motion.div>
          )}

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-primary" />
          </motion.div>

          <p className="text-sm text-muted-foreground mb-2">Código PIX Copia e Cola</p>
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-xs font-mono text-foreground break-all max-h-20 overflow-y-auto">{pixData.code}</p>
          </div>

          <Button variant="outline" className="w-full mb-4" onClick={copyPix}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Código PIX
          </Button>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-500 font-medium mb-1">⚠️ Importante</p>
            <p className="text-xs text-muted-foreground">
              Após o pagamento, seu depósito será creditado automaticamente em sua conta. O prazo pode ser de alguns segundos até 5 minutos.
            </p>
          </div>
        </motion.div>

        <Button variant="gradient" className="w-full" onClick={() => { setPixData(null); setAmount(""); refetchDeposits(); }}>
          Fazer Novo Depósito
        </Button>
      </motion.div>
    );
  }

  // Main form
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Depositar</h1>
        <p className="text-muted-foreground text-sm">Adicione saldo via PIX instantâneo</p>
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

      {/* Quick Amounts */}
      <div>
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4" />
          Valor do Depósito
        </h3>
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
        <label className="text-sm text-muted-foreground mb-2 block">Ou digite um valor</label>
        <Input
          type="number"
          placeholder="Mínimo R$ 30,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 text-lg"
        />
      </div>

      <Button variant="gradient" className="w-full" onClick={handleDeposit} disabled={loading || !isFormValid}>
        {loading ? "Gerando PIX..." : "Gerar PIX"}
      </Button>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Histórico de Depósitos</h2>

        {deposits && deposits.length > 0 ? (
          <div className="space-y-3">
            {deposits.map((deposit: any) => (
              <div key={deposit.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">R$ {Number(deposit.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(deposit.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deposit.status)}
                  <span className="text-sm text-muted-foreground">{getStatusText(deposit.status)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <ArrowDownCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Você ainda não fez nenhum depósito</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositTab;
