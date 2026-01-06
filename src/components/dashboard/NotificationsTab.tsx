import { useState, useMemo } from "react";
import { Bell, Check, CheckCheck, Filter, Info, AlertTriangle, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "error":
      return <XCircle className="w-5 h-5 text-destructive" />;
    default:
      return <Info className="w-5 h-5 text-primary" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "success":
      return "Sucesso";
    case "warning":
      return "Aviso";
    case "error":
      return "Erro";
    default:
      return "Informação";
  }
};

type DateFilter = "all" | "today" | "yesterday" | "week" | "month";
type TypeFilter = "all" | "info" | "success" | "warning" | "error";

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  return (
    <div
      className={cn(
        "p-4 border border-border rounded-xl transition-colors",
        !notification.is_read && "bg-primary/5 border-primary/20"
      )}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">{getTypeIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                !notification.is_read && "font-semibold"
              )}>
                {notification.title}
              </p>
              <span className={cn(
                "inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full",
                notification.type === "success" && "bg-green-500/10 text-green-500",
                notification.type === "warning" && "bg-yellow-500/10 text-yellow-500",
                notification.type === "error" && "bg-destructive/10 text-destructive",
                notification.type === "info" && "bg-primary/10 text-primary"
              )}>
                {getTypeLabel(notification.type)}
              </span>
            </div>
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/70">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsTab = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Type filter
      if (typeFilter !== "all" && n.type !== typeFilter) {
        return false;
      }

      // Date filter
      const date = new Date(n.created_at);
      switch (dateFilter) {
        case "today":
          return isToday(date);
        case "yesterday":
          return isYesterday(date);
        case "week":
          return isThisWeek(date, { locale: ptBR });
        case "month":
          return isThisMonth(date);
        default:
          return true;
      }
    });
  }, [notifications, dateFilter, typeFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};

    filteredNotifications.forEach((n) => {
      const date = new Date(n.created_at);
      let key: string;

      if (isToday(date)) {
        key = "Hoje";
      } else if (isYesterday(date)) {
        key = "Ontem";
      } else if (isThisWeek(date, { locale: ptBR })) {
        key = "Esta semana";
      } else if (isThisMonth(date)) {
        key = "Este mês";
      } else {
        key = format(date, "MMMM yyyy", { locale: ptBR });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(n);
    });

    return groups;
  }, [filteredNotifications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Notificações</h1>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Todas lidas"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Marcar todas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={dateFilter} onValueChange={(v: DateFilter) => setDateFilter(v)}>
            <SelectTrigger className="h-9">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={typeFilter} onValueChange={(v: TypeFilter) => setTypeFilter(v)}>
            <SelectTrigger className="h-9">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="info">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Informação
                </div>
              </SelectItem>
              <SelectItem value="success">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Sucesso
                </div>
              </SelectItem>
              <SelectItem value="warning">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Aviso
                </div>
              </SelectItem>
              <SelectItem value="error">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  Erro
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { type: "all", label: "Total", count: notifications.length, color: "bg-muted" },
          { type: "info", label: "Info", count: notifications.filter(n => n.type === "info").length, color: "bg-primary/10" },
          { type: "success", label: "Sucesso", count: notifications.filter(n => n.type === "success").length, color: "bg-green-500/10" },
          { type: "error", label: "Erro", count: notifications.filter(n => n.type === "error").length, color: "bg-destructive/10" },
        ].map((stat) => (
          <button
            key={stat.type}
            onClick={() => setTypeFilter(stat.type as TypeFilter)}
            className={cn(
              "p-2 rounded-lg text-center transition-colors",
              stat.color,
              typeFilter === stat.type && "ring-2 ring-primary"
            )}
          >
            <p className="text-lg font-bold">{stat.count}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <div className="py-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {notifications.length === 0
              ? "Você não tem notificações"
              : "Nenhuma notificação encontrada com os filtros selecionados"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group}
              </h3>
              <div className="space-y-3">
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;