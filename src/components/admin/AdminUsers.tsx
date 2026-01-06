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
import { Search, Edit, Trash2, Plus, Minus, RefreshCw, Eye, User } from "lucide-react";
import { format } from "date-fns";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceAction, setBalanceAction] = useState<"add" | "remove">("add");
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);

  const { data: users, isLoading, refetch } = useQuery({
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

  const fetchUserDetails = async (user: any) => {
    // Get investments
    const { data: investments } = await supabase
      .from("user_investments")
      .select("*, investment_plans(*)")
      .eq("user_id", user.user_id);

    // Get transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get referrals count
    const { data: referrals } = await supabase
      .from("profiles")
      .select("id")
      .eq("referred_by", user.id);

    // Get commissions
    const { data: commissions } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("beneficiary_id", user.user_id);

    setUserDetails({
      ...user,
      investments: investments || [],
      transactions: transactions || [],
      referralsCount: referrals?.length || 0,
      totalCommissions: commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0
    });
    setShowDetailsDialog(true);
  };

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
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.referral_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.cpf?.includes(searchTerm)
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
          <p className="text-muted-foreground">{users?.length || 0} usuários cadastrados</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, código, telefone ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Acumulado</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{user.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{user.cpf || "-"}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell className="font-mono text-sm text-primary">{user.referral_code}</TableCell>
                <TableCell className="text-green-500 font-bold">
                  R$ {Number(user.balance).toFixed(2)}
                </TableCell>
                <TableCell className="text-violet-500">
                  R$ {Number(user.accumulated_balance).toFixed(2)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(user.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchUserDetails(user)}
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowBalanceDialog(true);
                      }}
                      title="Editar saldo"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteUser(user)}
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Balance Dialog */}
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

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {userDetails?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {userDetails && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{userDetails.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPF</p>
                  <p className="font-mono">{userDetails.cpf || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p>{userDetails.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Código de Indicação</p>
                  <p className="font-mono text-primary">{userDetails.referral_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                  <p className="text-green-500 font-bold">R$ {Number(userDetails.balance).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Acumulado</p>
                  <p className="text-violet-500 font-bold">R$ {Number(userDetails.accumulated_balance).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Indicados</p>
                  <p className="font-bold">{userDetails.referralsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total em Comissões</p>
                  <p className="text-amber-500 font-bold">R$ {userDetails.totalCommissions.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Último Check-in</p>
                  <p>{userDetails.last_checkin_date ? format(new Date(userDetails.last_checkin_date), "dd/MM/yyyy") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cadastrado em</p>
                  <p>{format(new Date(userDetails.created_at), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>

              {/* Active Investments */}
              <div>
                <h3 className="font-semibold mb-2">Investimentos ({userDetails.investments?.length || 0})</h3>
                {userDetails.investments?.length > 0 ? (
                  <div className="space-y-2">
                    {userDetails.investments.map((inv: any) => (
                      <div key={inv.id} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{inv.investment_plans?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(inv.start_date), "dd/MM/yyyy")} - {format(new Date(inv.end_date), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R$ {Number(inv.amount).toFixed(2)}</p>
                          <p className="text-xs text-green-500">+R$ {Number(inv.daily_return).toFixed(2)}/dia</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          inv.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {inv.status === 'active' ? 'Ativo' : inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum investimento</p>
                )}
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="font-semibold mb-2">Últimas Transações</h3>
                {userDetails.transactions?.length > 0 ? (
                  <div className="space-y-2">
                    {userDetails.transactions.map((tx: any) => (
                      <div key={tx.id} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium capitalize">{tx.type === 'deposit' ? 'Depósito' : tx.type === 'withdrawal' ? 'Saque' : tx.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'deposit' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'approved' || tx.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma transação</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
