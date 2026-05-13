import { useState } from "react";
import { CollectionLayout } from "@/components/collection-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PhoneCall, MessageSquare, Mail, Globe2, CheckCircle2, Clock,
  TrendingUp, Users, Zap, BarChart3, Bell, Send, Radio
} from "lucide-react";

function ChannelCard({ icon: Icon, title, desc, status, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; status: string; color: string;
}) {
  return (
    <Card className={`border-${color}-200 bg-${color}-50/30`}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className={`rounded-lg bg-${color}-100 p-2.5 mb-3`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <Badge variant="outline" className={`text-${color}-700 border-${color}-300 bg-${color}-50 text-xs`}>{status}</Badge>
        </div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{value}</span>
        {change && <Badge variant="secondary" className="text-xs">{change}</Badge>}
      </div>
    </div>
  );
}

const recentActivity = [
  { time: "2 min ago", channel: "SMS", action: "Payment reminder sent", customer: "Rahul S.", outcome: "Delivered" },
  { time: "15 min ago", channel: "Call", action: "Agent call completed", customer: "Priya M.", outcome: "Promise to pay" },
  { time: "1 hr ago", channel: "WhatsApp", action: "Statement shared", customer: "Arjun N.", outcome: "Read" },
  { time: "2 hr ago", channel: "Email", action: "Escalation notice sent", customer: "Sunita K.", outcome: "Opened" },
  { time: "3 hr ago", channel: "Call", action: "No answer — retry scheduled", customer: "Vikram P.", outcome: "No answer" },
];

export default function CollectionOmniChannel() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <CollectionLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Omni-Channel Recovery</h1>
            <p className="text-muted-foreground mt-1">Unified view of all customer communication channels.</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 gap-1.5">
            <Radio className="h-3.5 w-3.5" /> All channels active
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <PhoneCall className="h-5 w-5 text-amber-600 mb-2" />
              <div className="text-2xl font-bold">48</div>
              <div className="text-xs text-muted-foreground">Calls today</div>
              <div className="text-xs text-green-600 mt-1">↑ 12 answered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <MessageSquare className="h-5 w-5 text-green-600 mb-2" />
              <div className="text-2xl font-bold">124</div>
              <div className="text-xs text-muted-foreground">SMS/WhatsApp sent</div>
              <div className="text-xs text-green-600 mt-1">↑ 89% delivered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <Mail className="h-5 w-5 text-blue-600 mb-2" />
              <div className="text-2xl font-bold">31</div>
              <div className="text-xs text-muted-foreground">Emails sent</div>
              <div className="text-xs text-blue-600 mt-1">↑ 64% opened</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
              <div className="text-2xl font-bold">7</div>
              <div className="text-xs text-muted-foreground">Promises to pay</div>
              <div className="text-xs text-green-600 mt-1">₹3.2L committed</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="voice"><PhoneCall className="h-4 w-4 mr-1.5" />Voice</TabsTrigger>
            <TabsTrigger value="messaging"><MessageSquare className="h-4 w-4 mr-1.5" />Messaging</TabsTrigger>
            <TabsTrigger value="activity"><Clock className="h-4 w-4 mr-1.5" />Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Channel performance</CardTitle></CardHeader>
                <CardContent>
                  <MetricRow label="Call connect rate" value="68%" change="+4% vs last week" />
                  <MetricRow label="SMS delivery rate" value="94%" change="+1%" />
                  <MetricRow label="Email open rate" value="61%" change="+8%" />
                  <MetricRow label="WhatsApp read rate" value="87%" />
                  <MetricRow label="Overall contact rate" value="72%" change="+6% vs last week" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Recovery metrics</CardTitle></CardHeader>
                <CardContent>
                  <MetricRow label="Promise-to-pay rate" value="29%" change="+3%" />
                  <MetricRow label="PTP kept (last 30d)" value="81%" />
                  <MetricRow label="Avg contacts before payment" value="3.2" />
                  <MetricRow label="Avg days to resolve" value="8.4 days" />
                  <MetricRow label="Escalation rate" value="12%" change="-2%" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ChannelCard icon={PhoneCall} title="Voice + Dialer" desc="Auto-dialer with call disposition tracking, retry rules, and call recording." status="Active" color="amber" />
              <ChannelCard icon={MessageSquare} title="SMS / WhatsApp" desc="Automated payment reminders with promise-to-pay capture and opt-out management." status="Active" color="green" />
              <ChannelCard icon={Mail} title="Email Nudges" desc="Send payment links, account statements, and escalation notices with tracking." status="Active" color="blue" />
              <ChannelCard icon={Globe2} title="Web Portal" desc="Self-service payment portal with live queue management and SLA markers." status="Active" color="purple" />
            </div>
          </TabsContent>

          <TabsContent value="voice" className="mt-5 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><PhoneCall className="h-5 w-5 text-amber-600" />Voice Dialer Settings</CardTitle>
                <CardDescription>Configure auto-dialer rules, retry logic, and call time windows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm">Calling hours</div>
                    <div className="text-xs text-muted-foreground">08:00 AM – 07:00 PM IST</div>
                    <Badge variant="outline" className="text-green-700 border-green-300">RBI compliant</Badge>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm">Retry rules</div>
                    <div className="text-xs text-muted-foreground">Max 3 attempts/day, 2-hr gap between retries</div>
                    <Badge variant="outline">Configured</Badge>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm">Call disposition</div>
                    <div className="text-xs text-muted-foreground">Answered, Busy, No answer, Not reachable, Promise to pay</div>
                  </div>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="font-medium text-sm">Recording</div>
                    <div className="text-xs text-muted-foreground">All calls recorded and retained for 90 days.</div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-medium text-sm mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Today's dialer queue</div>
                  <div className="flex items-center gap-6 text-sm">
                    <div><span className="text-2xl font-bold">24</span> <span className="text-muted-foreground text-xs">pending</span></div>
                    <div><span className="text-2xl font-bold text-green-600">12</span> <span className="text-muted-foreground text-xs">connected</span></div>
                    <div><span className="text-2xl font-bold text-red-500">8</span> <span className="text-muted-foreground text-xs">not reachable</span></div>
                    <div><span className="text-2xl font-bold text-amber-600">4</span> <span className="text-muted-foreground text-xs">retry later</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messaging" className="mt-5 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Send className="h-5 w-5 text-green-600" />Messaging Campaigns</CardTitle>
                <CardDescription>Configure automated SMS, WhatsApp, and email sequences for DPD buckets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { bucket: "1–30 DPD", channels: ["SMS", "WhatsApp"], message: "Gentle payment reminder with payment link", frequency: "Day 1, 7, 15", color: "yellow" },
                  { bucket: "31–60 DPD", channels: ["SMS", "WhatsApp", "Email"], message: "Escalation notice with settlement offer", frequency: "Every 5 days", color: "orange" },
                  { bucket: "61–90 DPD", channels: ["SMS", "Email", "Call"], message: "Legal notice warning + last settlement offer", frequency: "Every 3 days", color: "red" },
                  { bucket: "90+ DPD", channels: ["Call", "Legal"], message: "Legal proceedings initiation notice", frequency: "Weekly", color: "red" },
                ].map((row) => (
                  <div key={row.bucket} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{row.bucket}</div>
                      <div className="flex gap-1">
                        {row.channels.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{row.message}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{row.frequency}</div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm"><Bell className="h-4 w-4 mr-2" />Test message</Button>
                  <Button size="sm"><Send className="h-4 w-4 mr-2" />Send campaign now</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5" />Recent channel activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm border-b pb-3 last:border-0">
                      <div className="text-xs text-muted-foreground w-20 shrink-0">{a.time}</div>
                      <Badge variant={a.channel === "Call" ? "default" : a.channel === "SMS" ? "secondary" : "outline"} className="text-xs w-20 justify-center shrink-0">{a.channel}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{a.action}</div>
                        <div className="text-xs text-muted-foreground">{a.customer}</div>
                      </div>
                      <Badge variant={a.outcome === "Promise to pay" ? "default" : "outline"} className="text-xs shrink-0">{a.outcome}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CollectionLayout>
  );
}
