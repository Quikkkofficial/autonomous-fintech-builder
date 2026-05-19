import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  PhoneCall, MessageSquare, Mail, Send, Loader2, CheckCircle2, Users,
  Radio, Clock, Zap, BarChart3, RefreshCw, MessageCircle,
} from "lucide-react";

type User = { id: number; phone: string; name: string | null; role: string };

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-600", badge: "bg-green-100 text-green-700 border-green-300" },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "text-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "call", label: "Call", icon: PhoneCall, color: "text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-300" },
  { id: "email", label: "Email", icon: Mail, color: "text-purple-600", badge: "bg-purple-100 text-purple-700 border-purple-300" },
];

const LENDING_TEMPLATES = [
  { label: "New offer available", text: "Hi {name}, you have a pre-approved {loanType} loan offer of up to ₹{amount} at {rate}% p.a. Apply now on Quikkk — offer valid for 3 days." },
  { label: "Application approved", text: "Great news, {name}! Your loan application has been approved. Log in to Quikkk to complete disbursement steps." },
  { label: "Application reminder", text: "Hi {name}, your loan application at Quikkk is still pending. Complete your KYC to receive offers from 12+ lenders." },
  { label: "Rate drop alert", text: "Hi {name}, interest rates have dropped! Check your updated loan offers on Quikkk — better terms available now." },
  { label: "Custom", text: "" },
];

const COLLECTION_TEMPLATES = [
  { label: "Payment reminder", text: "Hi {name}, your EMI of ₹{emi} was due on {date}. Please pay now to avoid late charges. Pay at: {link}" },
  { label: "Overdue notice", text: "Dear {name}, your loan account is {dpd} days overdue. Outstanding: ₹{amount}. Contact us to discuss repayment options." },
  { label: "Settlement offer", text: "Hi {name}, we have a one-time settlement offer for you. Pay ₹{amount} by {date} to close your loan account. Call us now." },
  { label: "Legal warning", text: "Dear {name}, legal action may be initiated on your account if payment is not received within 7 days. Please call us immediately." },
  { label: "Custom", text: "" },
];

const SENT_LOG = [
  { time: "10 min ago", channel: "WhatsApp", recipient: "All customers (342)", purpose: "lending", message: "New rate drop alert", status: "Delivered" },
  { time: "1 hr ago", channel: "SMS", recipient: "Overdue customers (28)", purpose: "collection", message: "Payment reminder", status: "Sent" },
  { time: "3 hr ago", channel: "Email", recipient: "Approved applicants (15)", purpose: "lending", message: "Application approved", status: "Opened" },
  { time: "5 hr ago", channel: "Call", recipient: "90+ DPD (6)", purpose: "collection", message: "Legal warning", status: "Queued" },
];

function ComposePanel({ purpose }: { purpose: "lending" | "collection" }) {
  const { toast } = useToast();
  const templates = purpose === "lending" ? LENDING_TEMPLATES : COLLECTION_TEMPLATES;
  const [channel, setChannel] = useState("whatsapp");
  const [audience, setAudience] = useState("all_customers");
  const [template, setTemplate] = useState(templates[0].label);
  const [message, setMessage] = useState(templates[0].text);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");

  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api<User[]>("/admin/users"),
  });

  const send = useMutation({
    mutationFn: () => api("/admin/omni/send", {
      method: "POST",
      json: { channel, audience, message, purpose, scheduled, scheduleTime: scheduled ? scheduleTime : null },
    }),
    onSuccess: (d: any) => {
      toast({ title: "Message sent", description: `Dispatched to ${d.recipientCount ?? "all"} recipients via ${channel}.` });
    },
    onError: () => toast({ title: "Send failed", variant: "destructive" }),
  });

  const audienceOptions = [
    { value: "all_customers", label: "All customers" },
    { value: "kyc_pending", label: "KYC pending customers" },
    { value: "approved", label: "Approved applicants" },
    { value: "disbursed", label: "Disbursed borrowers" },
    { value: "overdue_1_30", label: "Overdue 1–30 DPD" },
    { value: "overdue_31_60", label: "Overdue 31–60 DPD" },
    { value: "overdue_60_plus", label: "Overdue 60+ DPD" },
    { value: "all_leads", label: "All partner leads" },
  ];

  function selectTemplate(label: string) {
    setTemplate(label);
    const t = templates.find(t => t.label === label);
    if (t) setMessage(t.text);
  }

  const charCount = message.length;
  const selectedChannel = CHANNELS.find(c => c.id === channel)!;
  const Icon = selectedChannel.icon;

  return (
    <div className="space-y-5 pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Channel</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHANNELS.map((c) => {
                const Ic = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${channel === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <Ic className={`h-5 w-5 ${c.color}`} />
                    <span className="text-xs font-medium">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {audienceOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Est. recipients: {users.data?.length ?? "…"}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Message template</Label>
            <Select value={template} onValueChange={selectTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map(t => <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Message</Label>
              <span className={`text-xs ${charCount > 160 && channel === "sms" ? "text-destructive" : "text-muted-foreground"}`}>{charCount} chars</span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your message… Use {name}, {amount}, {date} as placeholders."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Variables: {"{name}"}, {"{amount}"}, {"{date}"}, {"{rate}"}, {"{dpd}"}, {"{emi}"}</p>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="sched" checked={scheduled} onChange={e => setScheduled(e.target.checked)} className="rounded" />
            <label htmlFor="sched" className="text-sm font-medium">Schedule for later</label>
            {scheduled && <Input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="flex-1" />}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => send.mutate()}
              disabled={!message.trim() || send.isPending}
              className="gap-2 flex-1"
            >
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {scheduled ? "Schedule message" : `Send via ${selectedChannel.label}`}
            </Button>
          </div>

          {send.isSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4" />Message dispatched successfully
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className={`h-4 w-4 ${selectedChannel.color}`} />Message Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${channel === "whatsapp" ? "bg-green-50 border border-green-200" : channel === "email" ? "bg-blue-50 border border-blue-200" : "bg-muted"}`}>
                {message.replace("{name}", "Rahul Sharma").replace("{amount}", "₹5,00,000").replace("{rate}", "11.5%").replace("{date}", "15 Jan 2026").replace("{dpd}", "35").replace("{emi}", "₹12,400").replace("{loanType}", "Personal Loan").replace("{link}", "quikkk.in/pay") || <span className="text-muted-foreground italic">Your message will appear here…</span>}
              </div>
              {channel === "sms" && charCount > 160 && (
                <p className="text-xs text-destructive mt-2">Message exceeds 160 chars — will be split into {Math.ceil(charCount / 160)} SMS parts</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Channel compliance notes</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              {channel === "whatsapp" && <><p>• WhatsApp Business API — messages sent between 9 AM–9 PM IST</p><p>• Template messages need pre-approval from Meta for marketing</p><p>• Transactional messages (payment reminders) can be sent anytime</p></>}
              {channel === "sms" && <><p>• DLT-registered sender ID required (TRAI mandate)</p><p>• Marketing SMS only between 9 AM–9 PM IST</p><p>• Max 160 chars per SMS part</p></>}
              {channel === "call" && <><p>• Calls allowed only between 8 AM–7 PM IST (RBI guideline)</p><p>• Max 3 call attempts per day per customer</p><p>• All calls are recorded and retained for 90 days</p></>}
              {channel === "email" && <><p>• Unsubscribe link is added automatically</p><p>• DMARC/DKIM must be configured on the sending domain</p><p>• No restrictions on send time for transactional email</p></>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminOmniChannel() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Omni-Channel Communication</h1>
            <p className="text-muted-foreground mt-1">Send WhatsApp, SMS, calls, and emails to customers for lending outreach and collection recovery.</p>
          </div>
          <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-300">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> All channels active
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: PhoneCall, label: "Calls today", val: "48", sub: "12 answered", color: "text-amber-600" },
            { icon: MessageCircle, label: "WhatsApp sent", val: "124", sub: "87% delivered", color: "text-green-600" },
            { icon: MessageSquare, label: "SMS sent", val: "89", sub: "94% delivered", color: "text-blue-600" },
            { icon: Mail, label: "Emails sent", val: "31", sub: "64% opened", color: "text-purple-600" },
          ].map((s) => {
            const Ic = s.icon;
            return (
              <Card key={s.label}><CardContent className="pt-5"><Ic className={`h-5 w-5 ${s.color} mb-2`} /><div className="text-2xl font-bold">{s.val}</div><div className="text-xs text-muted-foreground">{s.label}</div><div className={`text-xs ${s.color} mt-1`}>{s.sub}</div></CardContent></Card>
            );
          })}
        </div>

        <Tabs defaultValue="lending">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="lending" className="gap-1.5"><Zap className="h-4 w-4" />Lending Outreach</TabsTrigger>
            <TabsTrigger value="collection" className="gap-1.5"><RefreshCw className="h-4 w-4" />Collection Recovery</TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5"><Clock className="h-4 w-4" />Sent Log</TabsTrigger>
          </TabsList>

          <TabsContent value="lending"><ComposePanel purpose="lending" /></TabsContent>
          <TabsContent value="collection"><ComposePanel purpose="collection" /></TabsContent>

          <TabsContent value="log" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Recent messages sent</CardTitle>
                <CardDescription>Last 24 hours of outbound communications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SENT_LOG.map((l, i) => {
                    const ch = CHANNELS.find(c => c.label === l.channel)!;
                    const Ic = ch?.icon ?? MessageSquare;
                    return (
                      <div key={i} className="flex items-center gap-4 text-sm border-b pb-3 last:border-0">
                        <div className="text-xs text-muted-foreground w-20 shrink-0">{l.time}</div>
                        <Badge className={`text-xs ${ch?.badge ?? ""} w-24 justify-center shrink-0`}>
                          <Ic className="h-3 w-3 mr-1" />{l.channel}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{l.message}</div>
                          <div className="text-xs text-muted-foreground">{l.recipient}</div>
                        </div>
                        <Badge variant="outline" className={l.purpose === "lending" ? "text-blue-700" : "text-amber-700"}>{l.purpose}</Badge>
                        <Badge variant={l.status === "Opened" ? "default" : "secondary"} className="text-xs shrink-0">{l.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
