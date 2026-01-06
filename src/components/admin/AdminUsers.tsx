import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Edit, Trash2, Plus, Minus } from "lucide-react";
import { format } from "date-fns";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceAction, setBalanceAction] = useState<"add" | "remove">("add");
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, newBalance }: { userId: string; newBalance: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Saldo atualizado com sucesso!");
      setShowBalanceDialog(false);
      setSelectedUser(null);
      setBalanceAmount("");
    },
    onError: () => {
      toast.error("Erro ao atualizar saldo");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar usuário");
    },
  });

  const handleBalanceUpdate = () => {
    if (!selectedUser || !balanceAmount) return;

    const amount = parseFloat(balanceAmount);
    const currentBalance = Number(selectedUser.balance);
    const newBalance = balanceAction === "add" 
      ? currentBalance + amount 
      : Math.max(0, currentBalance - amount);

    updateBalanceMutation.mutate({ userId: selectedUser.id, newBalance });
  };

  const handleDeleteUser = (user: any) => {
    if (confirm(`Tem certeza que deseja deletar ${user.full_name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const filteredUsers = users?.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerenciar todos os usuários</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Acumulado</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.referral_code}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell className="text-green-500">
                  R$ {Number(user.balance).toFixed(2)}
                </TableCell>
                <TableCell className="text-violet-500">
                  R$ {Number(user.accumulated_balance).toFixed(2)}
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowBalanceDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Saldo - {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Saldo atual</p>
              <p className="text-2xl font-bold text-green-500">
                R$ {Number(selectedUser?.balance || 0).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={balanceAction === "add" ? "default" : "outline"}
                onClick={() => setBalanceAction("add")}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
              <Button
                variant={balanceAction === "remove" ? "default" : "outline"}
                onClick={() => setBalanceAction("remove")}
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={handleBalanceUpdate}
              disabled={updateBalanceMutation.isPending}
            >
              {updateBalanceMutation.isPending ? "Atualizando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
