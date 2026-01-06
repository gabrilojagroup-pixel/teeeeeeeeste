import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

const AdminWithdrawals = () => {
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          profiles!transactions_user_id_fkey (full_name, phone, cpf)
        `)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, userId, amount }: { id: string; status: string; userId: string; amount: number }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Create notification for user
      const notificationData = {
        user_id: userId,
        title: status === "approved" ? "Saque aprovado!" : "Saque rejeitado",
        message: status === "approved" 
          ? `Seu saque de R$ ${amount.toFixed(2)} foi aprovado e será processado em breve.`
          : `Seu saque de R$ ${amount.toFixed(2)} foi rejeitado. O saldo foi devolvido à sua conta.`,
        type: status === "approved" ? "success" : "error",
        is_read: false,
      };

      await supabase.from("notifications").insert(notificationData);

      // If rejected, return balance to user
      if (status === "rejected") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (profile) {
          const newBalance = Number(profile.balance) + amount;
          await supabase
            .from("profiles")
            .update({ balance: newBalance })
            .eq("user_id", userId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">Pendente</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Aprovado</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500">Rejeitado</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-500">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Saques</h1>
        <p className="text-muted-foreground">Gerenciar solicitações de saque</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals?.map((withdrawal: any) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{withdrawal.profiles?.full_name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{withdrawal.profiles?.phone || "-"}</p>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-red-500">
                  R$ {Number(withdrawal.amount).toFixed(2)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {withdrawal.pix_key || "-"}
                </TableCell>
                <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                <TableCell>
                  {format(new Date(withdrawal.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {withdrawal.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-500"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: withdrawal.id, 
                          status: "approved",
                          userId: withdrawal.user_id,
                          amount: Number(withdrawal.amount)
                        })}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: withdrawal.id, 
                          status: "rejected",
                          userId: withdrawal.user_id,
                          amount: Number(withdrawal.amount)
                        })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {withdrawals?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum saque encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
