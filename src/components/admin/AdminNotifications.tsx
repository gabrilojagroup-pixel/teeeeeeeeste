import { useState } from "react";
import { Bell, Send, Users, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const notificationSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  message: z.string().trim().min(1, "Mensagem é obrigatória").max(500, "Mensagem deve ter no máximo 500 caracteres"),
  type: z.enum(["info", "success", "warning", "error"]),
});

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [sending, setSending] = useState(false);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users-for-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, referral_code")
        .order("full_name");

      if (error) throw error;
      return data || [];
    },
  });

  const handleSend = async () => {
    // Validate input
    const validation = notificationSchema.safeParse({ title, message, type });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (targetType === "specific" && !selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    setSending(true);

    try {
      if (targetType === "all") {
        // Get all user IDs
        const { data: allUsers, error: usersError } = await supabase
          .from("profiles")
          .select("user_id");

        if (usersError) throw usersError;

        // Insert notification for each user
        const notifications = (allUsers || []).map((u) => ({
          user_id: u.user_id,
          title: title.trim(),
          message: message.trim(),
          type,
          is_read: false,
        }));

        if (notifications.length === 0) {
          toast.error("Nenhum usuário encontrado");
          return;
        }

        const { error } = await supabase.from("notifications").insert(notifications);

        if (error) throw error;

        toast.success(`Notificação enviada para ${notifications.length} usuários`);
      } else {
        // Send to specific user
        const { error } = await supabase.from("notifications").insert({
          user_id: selectedUserId,
          title: title.trim(),
          message: message.trim(),
          type,
          is_read: false,
        });

        if (error) throw error;

        toast.success("Notificação enviada com sucesso");
      }

      // Reset form
      setTitle("");
      setMessage("");
      setType("info");
      setSelectedUserId("");
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error("Erro ao enviar notificação");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">Envie notificações para os usuários</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nova Notificação</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para enviar uma notificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">Destinatário</Label>
              <Select
                value={targetType}
                onValueChange={(value: "all" | "specific") => setTargetType(value)}
              >
                <SelectTrigger id="target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Todos os usuários</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Usuário específico</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === "specific" && (
              <div className="space-y-2">
                <Label htmlFor="user">Selecionar Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingUsers ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Carregando...
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.user_id}>
                          {user.full_name} ({user.referral_code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(value: "info" | "success" | "warning" | "error") =>
                  setType(value)
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Informação</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Sucesso</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Aviso</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span>Erro</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Atualização importante"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite a mensagem da notificação..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/500
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Notificação
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pré-visualização</CardTitle>
            <CardDescription>Veja como a notificação aparecerá</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      type === "success"
                        ? "bg-green-500"
                        : type === "warning"
                        ? "bg-yellow-500"
                        : type === "error"
                        ? "bg-destructive"
                        : "bg-primary"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {title || "Título da notificação"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message || "Mensagem da notificação aparecerá aqui..."}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">Agora mesmo</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Informações</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  • Destinatário:{" "}
                  {targetType === "all"
                    ? `Todos os usuários (${users.length})`
                    : users.find((u) => u.user_id === selectedUserId)?.full_name ||
                      "Nenhum selecionado"}
                </li>
                <li>
                  • Tipo:{" "}
                  {type === "info"
                    ? "Informação"
                    : type === "success"
                    ? "Sucesso"
                    : type === "warning"
                    ? "Aviso"
                    : "Erro"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;