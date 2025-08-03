import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import type { Notification } from "@shared/schema";

export default function NotificationCenter() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Local storage key for client-side notifications
  const localStorageKey = user ? `notifications_${user.id}` : null;

  // Fetch server notifications
  const { data: serverNotifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    retry: false,
  });

  // Get local notifications from localStorage
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);

  // Load local notifications on mount
  useEffect(() => {
    if (localStorageKey) {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalNotifications(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error("Error parsing local notifications:", error);
          setLocalNotifications([]);
        }
      }
    }
  }, [localStorageKey]);

  // Combine server and local notifications
  const allNotifications = [...serverNotifications, ...localNotifications]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const unreadCount = allNotifications.filter(n => !n.read).length;

  // Save local notifications to localStorage
  const saveLocalNotifications = (notifications: any[]) => {
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, JSON.stringify(notifications));
      setLocalNotifications(notifications);
    }
  };

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // Check if it's a server notification
      const isServerNotification = serverNotifications.some(n => n.id === notificationId);
      
      if (isServerNotification) {
        const response = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
        return response.json();
      } else {
        // Handle local notification
        const updated = localNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        saveLocalNotifications(updated);
        return { id: notificationId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // Check if it's a server notification
      const isServerNotification = serverNotifications.some(n => n.id === notificationId);
      
      if (isServerNotification) {
        const response = await apiRequest("DELETE", `/api/notifications/${notificationId}`);
        return response.json();
      } else {
        // Handle local notification
        const updated = localNotifications.filter(n => n.id !== notificationId);
        saveLocalNotifications(updated);
        return { id: notificationId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Clear server notifications
      const response = await apiRequest("DELETE", "/api/notifications");
      
      // Clear local notifications
      saveLocalNotifications([]);
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "security_purchased":
        return "💰";
      case "payment_received":
        return "✅";
      case "security_listed":
        return "📈";
      case "payment_due":
        return "⏰";
      default:
        return "📢";
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case "security_purchased":
        return "default";
      case "payment_received":
        return "default";
      case "security_listed":
        return "secondary";
      case "payment_due":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
                {allNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={clearAllMutation.isPending}
                    className="text-xs"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-xs text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="p-4 space-y-3">
                  {allNotifications.map((notification, index) => (
                    <div key={notification.id || index}>
                      <div className={`p-3 rounded-lg border transition-colors ${
                        notification.read 
                          ? "bg-gray-50 border-gray-200" 
                          : "bg-blue-50 border-blue-200"
                      }`}>
                        <div className="flex items-start justify-between space-x-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <Badge 
                                variant={getNotificationVariant(notification.type)} 
                                className="text-xs"
                              >
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(notification.createdAt || new Date()), "MMM dd, HH:mm")}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={markAsReadMutation.isPending}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {index < allNotifications.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}