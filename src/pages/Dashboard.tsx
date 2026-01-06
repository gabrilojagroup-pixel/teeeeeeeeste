import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardNav from "@/components/dashboard/DashboardNav";
import HomeTab from "@/components/dashboard/HomeTab";
import PlansTab from "@/components/dashboard/PlansTab";
import AffiliatesTab from "@/components/dashboard/AffiliatesTab";
import CheckinTab from "@/components/dashboard/CheckinTab";
import DepositTab from "@/components/dashboard/DepositTab";
import WithdrawTab from "@/components/dashboard/WithdrawTab";
import HistoryTab from "@/components/dashboard/HistoryTab";

export type TabType = "home" | "plans" | "affiliates" | "checkin" | "deposit" | "withdraw" | "history";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("home");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "plans":
        return <PlansTab />;
      case "affiliates":
        return <AffiliatesTab />;
      case "checkin":
        return <CheckinTab />;
      case "deposit":
        return <DepositTab />;
      case "withdraw":
        return <WithdrawTab />;
      case "history":
        return <HistoryTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="pb-24 pt-4 px-4 max-w-lg mx-auto">
        {renderContent()}
      </main>
      <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;
