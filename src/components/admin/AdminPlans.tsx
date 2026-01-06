import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit, Trash2 } from "lucide-react";

interface PlanForm {
  name: string;
  min_amount: string;
  max_amount: string;
  daily_return_percentage: string;
  duration_days: string;
  is_active: boolean;
}

const AdminPlans = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState<PlanForm>({
    name: "",
    min_amount: "",
    max_amount: "",
    daily_return_percentage: "",
    duration_days: "",
    is_active: true,
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_plans")
        .select("*")
        .order("min_amount", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      const { error } = await supabase
        .from("investment_plans")
        .insert(planData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano criado com sucesso!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar plano");
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...planData }: any) => {
      const { error } = await supabase
        .from("investment_plans")
        .update(planData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano atualizado com sucesso!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar plano");
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("investment_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar plano");
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      min_amount: "",
      max_amount: "",
      daily_return_percentage: "",
      duration_days: "",
      is_active: true,
    });
    setEditingPlan(null);
    setShowDialog(false);
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      min_amount: plan.min_amount.toString(),
      max_amount: plan.max_amount.toString(),
      daily_return_percentage: plan.daily_return_percentage.toString(),
      duration_days: plan.duration_days.toString(),
      is_active: plan.is_active,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const planData = {
      name: form.name,
      min_amount: parseFloat(form.min_amount),
      max_amount: parseFloat(form.max_amount),
      daily_return_percentage: parseFloat(form.daily_return_percentage),
      duration_days: parseInt(form.duration_days),
      is_active: form.is_active,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, ...planData });
    } else {
      createPlanMutation.mutate(planData);
    }
  };

  const handleDelete = (plan: any) => {
    if (confirm(`Tem certeza que deseja deletar o plano ${plan.name}?`)) {
      deletePlanMutation.mutate(plan.id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground">Gerenciar planos de investimento</p>
        </div>
        <Button variant="gradient" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor Mín.</TableHead>
              <TableHead>Valor Máx.</TableHead>
              <TableHead>% Diário</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>R$ {Number(plan.min_amount).toFixed(2)}</TableCell>
                <TableCell>R$ {Number(plan.max_amount).toFixed(2)}</TableCell>
                <TableCell className="text-green-500">
                  {Number(plan.daily_return_percentage).toFixed(2)}%
                </TableCell>
                <TableCell>{plan.duration_days} dias</TableCell>
                <TableCell>
                  {plan.is_active ? (
                    <span className="text-green-500">Sim</span>
                  ) : (
                    <span className="text-red-500">Não</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(plan)}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Plano Gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.min_amount}
                  onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.max_amount}
                  onChange={(e) => setForm({ ...form, max_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>% Rendimento Diário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.daily_return_percentage}
                  onChange={(e) => setForm({ ...form, daily_return_percentage: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Plano Ativo</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={handleSubmit}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
            >
              {editingPlan ? "Atualizar" : "Criar"} Plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlans;
