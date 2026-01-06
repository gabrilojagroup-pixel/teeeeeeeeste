import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Save, Eye, EyeOff } from "lucide-react";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    pix_api_key: "",
    payment_gateway_key: "",
    webhook_secret: "",
  });

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const newApiKeys = { ...apiKeys };
      settings.forEach((setting) => {
        if (setting.key in newApiKeys) {
          (newApiKeys as any)[setting.key] = setting.value || "";
        }
      });
      setApiKeys(newApiKeys);
    }
  }, [settings]);

  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existing = settings?.find((s) => s.key === key);

      if (existing) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ value })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert({ key, value });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configuração");
    },
  });

  const handleSaveAll = () => {
    Object.entries(apiKeys).forEach(([key, value]) => {
      if (value) {
        saveSettingMutation.mutate({ key, value });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerenciar chaves API e configurações</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Chaves API</h2>
            <p className="text-sm text-muted-foreground">
              Configure suas chaves de integração
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Chave API PIX</Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKeys.pix_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, pix_api_key: e.target.value })}
                placeholder="Sua chave API PIX"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chave Gateway de Pagamento</Label>
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKeys.payment_gateway_key}
              onChange={(e) => setApiKeys({ ...apiKeys, payment_gateway_key: e.target.value })}
              placeholder="Sua chave do gateway"
            />
          </div>

          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKeys.webhook_secret}
              onChange={(e) => setApiKeys({ ...apiKeys, webhook_secret: e.target.value })}
              placeholder="Secret do webhook"
            />
          </div>
        </div>

        <Button
          variant="gradient"
          onClick={handleSaveAll}
          disabled={saveSettingMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveSettingMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">Informações do Sistema</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Versão</p>
            <p className="font-medium">1.0.0</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ambiente</p>
            <p className="font-medium">Produção</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
