import { useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, MessageCircle, Smartphone } from "lucide-react";
import { formatDateTime } from "@/lib/format";

const channelIcon = {
  sms: Smartphone,
  email: Mail,
  whatsapp: MessageCircle,
  app: Bell,
};

export default function Notifications() {
  const { data, isLoading } = useListNotifications();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Updates on your applications and offers.</p>
      </div>

      {isLoading && [1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />No notifications yet</CardContent></Card>
      )}
      <div className="space-y-2">
        {data?.map((n) => {
          const Icon = channelIcon[n.channel as keyof typeof channelIcon] ?? Bell;
          return (
            <Card key={n.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{n.title}</div>
                    <Badge variant="outline" className="text-xs uppercase">{n.channel}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-2">{formatDateTime(n.createdAt)}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
