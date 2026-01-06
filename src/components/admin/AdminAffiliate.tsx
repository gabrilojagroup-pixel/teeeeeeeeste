import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Award, Users } from "lucide-react";

const AdminAffiliate = () => {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select(`
          *,
          beneficiary:profiles!affiliate_commissions_beneficiary_id_fkey (full_name),
          source:profiles!affiliate_commissions_source_user_id_fkey (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-affiliate-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_commissions")
        .select("level, amount");

      const level1Total = data?.filter(c => c.level === 1).reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const level2Total = data?.filter(c => c.level === 2).reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const level3Total = data?.filter(c => c.level === 3).reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      return {
        level1Total,
        level2Total,
        level3Total,
        total: level1Total + level2Total + level3Total,
      };
    },
  });

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">Nível 1 (25%)</span>;
      case 2:
        return <span className="px-2 py-1 text-xs rounded-full bg-violet-500/10 text-violet-500">Nível 2 (3%)</span>;
      case 3:
        return <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">Nível 3 (2%)</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-500">-</span>;
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
        <h1 className="text-2xl font-bold text-foreground">Unilevel / Afiliados</h1>
        <p className="text-muted-foreground">Histórico de comissões de afiliados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nível 1 (25%)</p>
              <p className="text-xl font-bold text-yellow-500">
                R$ {(stats?.level1Total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nível 2 (3%)</p>
              <p className="text-xl font-bold text-violet-500">
                R$ {(stats?.level2Total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nível 3 (2%)</p>
              <p className="text-xl font-bold text-primary">
                R$ {(stats?.level3Total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Geral</p>
              <p className="text-xl font-bold text-green-500">
                R$ {(stats?.total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiário</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions?.map((commission: any) => (
              <TableRow key={commission.id}>
                <TableCell className="font-medium">
                  {commission.beneficiary?.full_name || "N/A"}
                </TableCell>
                <TableCell>
                  {commission.source?.full_name || "N/A"}
                </TableCell>
                <TableCell>{getLevelBadge(commission.level)}</TableCell>
                <TableCell className="font-bold text-green-500">
                  R$ {Number(commission.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  {format(new Date(commission.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))}
            {commissions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma comissão encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminAffiliate;
