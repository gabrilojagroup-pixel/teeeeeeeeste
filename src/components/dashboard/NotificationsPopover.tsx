import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "error":
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Info className="w-4 h-4 text-primary" />;
  }
};

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
        "p-3 border-b border-border last:border-0 transition-colors",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">{getTypeIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm truncate",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

const NotificationsPopover = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;