import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminWithdrawals from "@/components/admin/AdminWithdrawals";
import AdminDeposits from "@/components/admin/AdminDeposits";
import AdminPlans from "@/components/admin/AdminPlans";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminSponsorships from "@/components/admin/AdminSponsorships";
import AdminAffiliate from "@/components/admin/AdminAffiliate";

export type AdminTabType = 
  | "dashboard" 
  | "users" 
  | "withdrawals" 
  | "deposits" 
  | "plans" 
  | "settings" 
  | "sponsorships"
  | "affiliate";

const AdminPanel = () => {
  const { loading, isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <AdminUsers />;
      case "withdrawals":
        return <AdminWithdrawals />;
      case "deposits":
        return <AdminDeposits />;
      case "plans":
        return <AdminPlans />;
      case "settings":
        return <AdminSettings />;
      case "sponsorships":
        return <AdminSponsorships />;
      case "affiliate":
        return <AdminAffiliate />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminPanel;
