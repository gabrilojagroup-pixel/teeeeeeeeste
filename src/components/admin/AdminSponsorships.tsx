import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Target } from "lucide-react";

interface SponsorshipForm {
  name: string;
  description: string;
  goal_amount: string;
  current_amount: string;
  is_active: boolean;
}

const AdminSponsorships = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState<any>(null);
  const [form, setForm] = useState<SponsorshipForm>({
    name: "",
    description: "",
    goal_amount: "",
    current_amount: "0",
    is_active: true,
  });

  const { data: sponsorships, isLoading } = useQuery({
    queryKey: ["admin-sponsorships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsorships")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("sponsorships")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sponsorships"] });
      toast.success("Patrocínio criado com sucesso!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar patrocínio");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("sponsorships")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sponsorships"] });
      toast.success("Patrocínio atualizado com sucesso!");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar patrocínio");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sponsorships")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sponsorships"] });
      toast.success("Patrocínio deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar patrocínio");
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      goal_amount: "",
      current_amount: "0",
      is_active: true,
    });
    setEditingSponsorship(null);
    setShowDialog(false);
  };

  const handleEdit = (sponsorship: any) => {
    setEditingSponsorship(sponsorship);
    setForm({
      name: sponsorship.name,
      description: sponsorship.description || "",
      goal_amount: sponsorship.goal_amount.toString(),
      current_amount: sponsorship.current_amount.toString(),
      is_active: sponsorship.is_active,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const data = {
      name: form.name,
      description: form.description,
      goal_amount: parseFloat(form.goal_amount),
      current_amount: parseFloat(form.current_amount),
      is_active: form.is_active,
    };

    if (editingSponsorship) {
      updateMutation.mutate({ id: editingSponsorship.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (sponsorship: any) => {
    if (confirm(`Tem certeza que deseja deletar "${sponsorship.name}"?`)) {
      deleteMutation.mutate(sponsorship.id);
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
          <h1 className="text-2xl font-bold text-foreground">Patrocínios</h1>
          <p className="text-muted-foreground">Gerenciar metas de patrocínio</p>
        </div>
        <Button variant="gradient" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Patrocínio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sponsorships?.map((sponsorship) => {
          const progress = (Number(sponsorship.current_amount) / Number(sponsorship.goal_amount)) * 100;

          return (
            <div
              key={sponsorship.id}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{sponsorship.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {sponsorship.is_active ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(sponsorship)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(sponsorship)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {sponsorship.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {sponsorship.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">
                    R$ {Number(sponsorship.current_amount).toFixed(2)} / R$ {Number(sponsorship.goal_amount).toFixed(2)}
                  </span>
                </div>
                <Progress value={Math.min(progress, 100)} />
                <p className="text-xs text-right text-muted-foreground">
                  {progress.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}

        {sponsorships?.length === 0 && (
          <div className="col-span-2 bg-card rounded-xl border border-border p-8 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum patrocínio cadastrado</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSponsorship ? "Editar Patrocínio" : "Novo Patrocínio"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do patrocínio"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.goal_amount}
                  onChange={(e) => setForm({ ...form, goal_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Atual (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.current_amount}
                  onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSponsorship ? "Atualizar" : "Criar"} Patrocínio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSponsorships;
