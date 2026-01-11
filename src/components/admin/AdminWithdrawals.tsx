import { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Check, X, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";

const AdminWithdrawals = () => {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'manual' | null;
    withdrawal: any;
  }>({ open: false, action: null, withdrawal: null });

  const { data: withdrawals, isLoading, refetch } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(transactions?.map(t => t.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, cpf")
        .in("user_id", userIds);

      return transactions?.map(t => ({
        ...t,
        profile: profiles?.find(p => p.user_id === t.user_id)
      })) || [];
    },
  });

  const processWithdrawMutation = useMutation({
    mutationFn: async ({ transactionId, action }: { transactionId: string; action: 'approve' | 'reject' | 'manual' }) => {
      const { data, error } = await supabase.functions.invoke('admin-process-withdraw', {
        body: { transactionId, action }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.message || "Operação realizada com sucesso!");
      setConfirmDialog({ open: false, action: null, withdrawal: null });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao processar saque");
      setConfirmDialog({ open: false, action: null, withdrawal: null });
    },
  });

  const handleConfirm = () => {
    if (confirmDialog.withdrawal && confirmDialog.action) {
      processWithdrawMutation.mutate({
        transactionId: confirmDialog.withdrawal.id,
        action: confirmDialog.action
      });
    }
  };

  const openConfirmDialog = (withdrawal: any, action: 'approve' | 'reject' | 'manual') => {
    setConfirmDialog({ open: true, action, withdrawal });
  };

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

  const dialogWithdrawal = confirmDialog.withdrawal;
  const dialogAmount = dialogWithdrawal ? Number(dialogWithdrawal.amount) : 0;
  const dialogNetAmount = dialogAmount - (dialogAmount * 0.10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saques</h1>
          <p className="text-muted-foreground">Gerenciar e pagar saques via PIX</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Líquido / Taxa</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals?.map((withdrawal: any) => {
              const amount = Number(withdrawal.amount);
              const fee = amount * 0.10;
              const netAmount = amount - fee;
              
              return (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{withdrawal.profile?.full_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{withdrawal.profile?.phone || "-"}</p>
                      <p className="text-xs text-muted-foreground">CPF: {withdrawal.profile?.cpf || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-red-500">
                    R$ {amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-green-500 font-medium">R$ {netAmount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Taxa: R$ {fee.toFixed(2)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm font-mono">{withdrawal.pix_key || "-"}</p>
                  </TableCell>
                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(withdrawal.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === "pending" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                          onClick={() => openConfirmDialog(withdrawal, "manual")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Manual
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openConfirmDialog(withdrawal, "reject")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {withdrawals?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum saque encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null, withdrawal: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'manual' ? '✋ Aprovar Manualmente' : confirmDialog.action === 'approve' ? '💸 Confirmar Pagamento' : '❌ Confirmar Rejeição'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {confirmDialog.action === 'manual' ? (
                  <>
                    <p>Você está aprovando este saque <strong>manualmente</strong>:</p>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      <p><strong>Usuário:</strong> {dialogWithdrawal?.profile?.full_name || "N/A"}</p>
                      <p><strong>Chave PIX:</strong> <span className="font-mono text-sm">{dialogWithdrawal?.pix_key}</span></p>
                      <p><strong>Valor solicitado:</strong> R$ {dialogAmount.toFixed(2)}</p>
                      <p className="text-green-600 font-bold"><strong>Valor a enviar:</strong> R$ {dialogNetAmount.toFixed(2)}</p>
                    </div>
                    <p className="text-blue-600 text-sm">ℹ️ Faça o PIX manualmente na PoseidonPay e depois confirme aqui.</p>
                  </>
                ) : confirmDialog.action === 'approve' ? (
                  <>
                    <p>Você está prestes a pagar o saque via PIX:</p>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      <p><strong>Usuário:</strong> {dialogWithdrawal?.profile?.full_name || "N/A"}</p>
                      <p><strong>Chave PIX:</strong> {dialogWithdrawal?.pix_key}</p>
                      <p><strong>Valor solicitado:</strong> R$ {dialogAmount.toFixed(2)}</p>
                      <p className="text-green-600 font-bold"><strong>Valor a enviar:</strong> R$ {dialogNetAmount.toFixed(2)}</p>
                    </div>
                    <p className="text-yellow-600 text-sm">⚠️ Esta ação irá enviar o PIX automaticamente e não pode ser desfeita.</p>
                  </>
                ) : (
                  <>
                    <p>Você está prestes a rejeitar o saque:</p>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      <p><strong>Usuário:</strong> {dialogWithdrawal?.profile?.full_name || "N/A"}</p>
                      <p><strong>Valor:</strong> R$ {dialogAmount.toFixed(2)}</p>
                    </div>
                    <p className="text-sm">O saldo será devolvido automaticamente para a conta do usuário.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processWithdrawMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={processWithdrawMutation.isPending}
              className={confirmDialog.action === 'manual' ? 'bg-blue-600 hover:bg-blue-700' : confirmDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {processWithdrawMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog.action === 'manual' ? 'Confirmar Aprovação Manual' : confirmDialog.action === 'approve' ? 'Confirmar Pagamento' : 'Confirmar Rejeição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWithdrawals;
