import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  PhoneCall, MessageSquare, Mail, Send, Loader2, CheckCircle2,
  Radio, Clock, MessageCircle, BarChart3, Zap,
} from "lucide-react";

type Lead = {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  type: string;
  amount: string;
  status: string;
};

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { id: "call", label: "Call", icon: PhoneCall, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { id: "email", label: "Email", icon: Mail, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
];

const TEMPLATES = [
  { label: "Follow up on application", text: "Hi {name}, this is a follow-up on your loan application with Quikkk. Is there anything we can help you with? Reply to this message or call us." },
  { label: "Share loan offer", text: "Hi {name}, you have a pre-approved loan offer of ₹{amount} on Quikkk! Low interest rates, quick disbursal. Apply now at quikkk.in" },
  { label: "Document reminder", text: "Hi {name}, your loan application is almost done! Please upload your KYC documents to proceed. Visit quikkk.in/kyc" },
  { label: "Application status update", text: "Hi {name}, your loan application status has been updated. Log in to quikkk.in to view the latest update." },
  { label: "Custom message", text: "" },
];

const SENT_LOG = [
  { time: "30 min ago", channel: "WhatsApp", recipient: "Rahul Sharma", message: "Follow up on application", status: "Read" },
  { time: "2 hr ago", channel: "SMS", recipient: "Priya Mehta", message: "Share loan offer", status: "Delivered" },
  { time: "4 hr ago", channel: "Call", recipient: "Arjun Nair", message: "Manual call", status: "Answered" },
  { time: "1 day ago", channel: "Email", recipient: "All my leads (12)", message: "Document reminder", status: "Opened" },
];

export default function PartnerOmniChannel() {
  const { toast } = useToast();
  const [channel, setChannel] = useState("whatsapp");
  const [audience, setAudience] = useState("all");
  const [specificLead, setSpecificLead] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0].label);
  const [message, setMessage] = useState(TEMPLATES[0].text);

  const leads = useQuery({
    queryKey: ["partner", "leads"],
    queryFn: () => api<Lead[]>("/partner/leads"),
  });

  const send = useMutation({
    mutationFn: () => api("/partner/omni/send", {
      method: "POST",
      json: { channel, audience, specificLeadId: audience === "specific" ? specificLead : null, message },
    }),
    onSuccess: (d: any) => {
      toast({ title: "Message sent", description: `Sent to ${d.recipientCount ?? 1} lead(s) via ${channel}.` });
    },
    onError: () => toast({ title: "Send failed", variant: "destructive" }),
  });

  function selectTemplate(label: string) {
    setTemplate(label);
    const t = TEMPLATES.find(t => t.label === label);
    if (t) setMessage(t.text);
  }

  const selectedChannel = CHANNELS.find(c => c.id === channel)!;
  const Icon = selectedChannel.icon;

  const audienceLabel = (() => {
    if (audience === "all") return `All my leads (${leads.data?.length ?? "…"})`;
    if (audience === "pending") return "Pending applications";
    if (audience === "approved") return "Approved leads";
    if (audience === "specific" && specificLead) {
      const lead = leads.data?.find(l => l.id === specificLead);
      return lead?.customerName ?? "1 lead";
    }
    return "Select audience";
  })();

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Omni-Channel Outreach</h1>
            <p className="text-muted-foreground mt-1">Reach your leads via WhatsApp, SMS, call, or email to follow up and convert.</p>
          </div>
          <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-300">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> All channels active
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MessageCircle, label: "WhatsApp", val: "34", color: "text-green-600" },
            { icon: MessageSquare, label: "SMS", val: "18", color: "text-blue-600" },
            { icon: PhoneCall, label: "Calls", val: "9", color: "text-amber-600" },
            { icon: Mail, label: "Emails", val: "12", color: "text-purple-600" },
          ].map(s => {
            const Ic = s.icon;
            return (
              <Card key={s.label}><CardContent className="pt-4"><Ic className={`h-4 w-4 ${s.color} mb-1`} /><div className="text-xl font-bold">{s.val}</div><div className="text-xs text-muted-foreground">sent this week</div></CardContent></Card>
            );
          })}
        </div>

        <Tabs defaultValue="compose">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="compose" className="gap-1.5"><Zap className="h-4 w-4" />Compose</TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5"><Clock className="h-4 w-4" />Sent Log</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Channel</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHANNELS.map((c) => {
                      const Ic = c.icon;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setChannel(c.id)}
                          className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all text-sm font-medium ${channel === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        >
                          <Ic className={`h-4 w-4 ${c.color}`} />{c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Recipients</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All my leads</SelectItem>
                      <SelectItem value="pending">Pending / submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="specific">Specific lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {audience === "specific" && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Select lead</Label>
                    <Select value={specificLead} onValueChange={setSpecificLead}>
                      <SelectTrigger><SelectValue placeholder="Choose a lead…" /></SelectTrigger>
                      <SelectContent>
                        {leads.data?.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.customerName ?? l.customerPhone} — {l.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-sm font-medium">Template</Label>
                  <Select value={template} onValueChange={selectTemplate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(t => <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-sm font-medium">Message</Label>
                    <span className="text-xs text-muted-foreground">{message.length} chars</span>
                  </div>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Type your message…" className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">Variables: {"{name}"}, {"{amount}"}, {"{date}"}</p>
                </div>

                <Button onClick={() => send.mutate()} disabled={!message.trim() || send.isPending} className="w-full gap-2">
                  {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send to {audienceLabel}
                </Button>

                {send.isSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-green-700 text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Message sent successfully
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Icon className={`h-4 w-4 ${selectedChannel.color}`} />Preview</CardTitle></CardHeader>
                  <CardContent>
                    <div className={`rounded-xl p-4 text-sm leading-relaxed border whitespace-pre-wrap ${selectedChannel.bg}`}>
                      {message.replace("{name}", "Rahul Sharma").replace("{amount}", "₹5,00,000").replace("{date}", "15 Jan 2026") || <span className="text-muted-foreground italic">Your message will appear here…</span>}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tips for better conversions</CardTitle></CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1.5">
                    <p>• Personalise with customer name for 3× higher open rates</p>
                    <p>• Send WhatsApp between 10 AM–1 PM for best response</p>
                    <p>• Keep SMS under 160 chars to avoid splitting</p>
                    <p>• Always include a clear call-to-action (apply link / phone number)</p>
                    <p>• Follow up within 24 hours of sharing an offer</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="log" className="pt-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Sent messages</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SENT_LOG.map((l, i) => {
                    const ch = CHANNELS.find(c => c.label === l.channel)!;
                    const Ic = ch?.icon ?? MessageSquare;
                    return (
                      <div key={i} className="flex items-center gap-4 text-sm border-b pb-3 last:border-0">
                        <div className="text-xs text-muted-foreground w-20 shrink-0">{l.time}</div>
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${ch?.bg ?? ""} w-24 justify-center shrink-0`}>
                          <Ic className={`h-3 w-3 ${ch?.color ?? ""}`} />{l.channel}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{l.message}</div>
                          <div className="text-xs text-muted-foreground">{l.recipient}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{l.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}
