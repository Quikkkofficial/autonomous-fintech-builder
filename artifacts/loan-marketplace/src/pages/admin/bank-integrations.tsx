import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Landmark, PlusCircle, Wifi, WifiOff, Clock, CheckCircle2, XCircle,
  Loader2, Settings, Trash2, Send, Activity, Edit2, X,
} from "lucide-react";

type Integration = {
  id: string;
  name: string;
  slug: string;
  apiType: string;
  apiEndpoint: string | null;
  clientId: string | null;
  status: string;
  supportedTypes: string[];
  notes: string | null;
  totalSent: number;
  totalAccepted: number;
  totalRejected: number;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  inactive: "bg-zinc-100 text-zinc-700 border-zinc-300",
  pending_whitelist: "bg-orange-100 text-orange-800 border-orange-300",
  error: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <Wifi className="h-4 w-4 text-green-600" />,
  inactive: <WifiOff className="h-4 w-4 text-zinc-400" />,
  pending_whitelist: <Clock className="h-4 w-4 text-orange-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
};

const LOAN_TYPES = ["personal", "home", "auto", "business", "education", "gold", "fd", "mutual_fund", "insurance"];

function AddIntegrationModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    apiType: "custom",
    apiEndpoint: "",
    clientId: "",
    clientSecret: "",
    notes: "",
    supportedTypes: [] as string[],
  });

  const create = useMutation({
    mutationFn: () => api("/admin/integrations", { method: "POST", json: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "integrations"] });
      toast({ title: "Integration added", description: `${form.name} has been added.` });
      onClose();
    },
    onError: () => toast({ title: "Failed to add integration", variant: "destructive" }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleType = (t: string) =>
    setForm((f) => ({
      ...f,
      supportedTypes: f.supportedTypes.includes(t) ? f.supportedTypes.filter((x) => x !== t) : [...f.supportedTypes, t],
    }));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5" />Add Bank / NBFC Integration</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <CardDescription>Configure API connection to a new bank or NBFC partner.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Institution Name *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="HDFC Bank" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug (unique key) *</Label>
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "_"))} placeholder="hdfc" required />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">API Type</Label>
              <Select value={form.apiType} onValueChange={(v) => set("apiType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urbanmoney">Urban Money (pre-configured)</SelectItem>
                  <SelectItem value="webhook">Webhook (POST JSON)</SelectItem>
                  <SelectItem value="rest">REST API</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">API Endpoint URL</Label>
              <Input value={form.apiEndpoint} onChange={(e) => set("apiEndpoint", e.target.value)} placeholder="https://api.bank.com/v1/lead/create" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Client ID / API Key</Label>
                <Input value={form.clientId} onChange={(e) => set("clientId", e.target.value)} placeholder="client-id" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client Secret</Label>
                <Input type="password" value={form.clientSecret} onChange={(e) => set("clientSecret", e.target.value)} placeholder="client-secret" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Supported Loan Types</Label>
              <div className="flex flex-wrap gap-2">
                {LOAN_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${form.supportedTypes.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Contact person, whitelist IP required, etc." />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Integration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EditModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState(integration.status);
  const [notes, setNotes] = useState(integration.notes ?? "");
  const [apiEndpoint, setApiEndpoint] = useState(integration.apiEndpoint ?? "");

  const update = useMutation({
    mutationFn: () => api(`/admin/integrations/${integration.id}`, { method: "PATCH", json: { status, notes, apiEndpoint } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "integrations"] });
      toast({ title: "Updated" });
      onClose();
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: () => api(`/admin/integrations/${integration.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "integrations"] });
      toast({ title: "Integration removed" });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4" />Edit {integration.name}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending_whitelist">Pending Whitelist</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">API Endpoint</Label>
            <Input value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="destructive" size="sm" onClick={() => del.mutate()} disabled={del.isPending || integration.slug === "urbanmoney"}>
              {del.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}Remove
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => update.mutate()} disabled={update.isPending}>
                {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminBankIntegrations() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const integrations = useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: () => api<Integration[]>("/admin/integrations"),
    refetchInterval: 30_000,
  });

  const pushAll = useMutation({
    mutationFn: ({ id }: { id: string }) => api(`/admin/integrations/${id}/push-pending`, { method: "POST" }),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ["admin", "integrations"] });
      qc.invalidateQueries({ queryKey: ["admin", "dispatches"] });
      toast({ title: `Push complete`, description: `${d.pushed ?? 0} leads dispatched.` });
    },
    onError: () => toast({ title: "Push failed", variant: "destructive" }),
  });

  const totalSent = integrations.data?.reduce((s, i) => s + i.totalSent, 0) ?? 0;
  const totalAccepted = integrations.data?.reduce((s, i) => s + i.totalAccepted, 0) ?? 0;
  const activeCount = integrations.data?.filter((i) => i.status === "active").length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bank &amp; NBFC Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Configure API connections to banks and NBFCs. All partner leads are auto-forwarded to active integrations.
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />Add Integration
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-5"><Activity className="h-5 w-5 text-muted-foreground mb-2" /><div className="text-2xl font-bold">{integrations.data?.length ?? 0}</div><div className="text-sm text-muted-foreground">Total configured</div></CardContent></Card>
          <Card className="border-green-200 bg-green-50/40"><CardContent className="pt-5"><Wifi className="h-5 w-5 text-green-600 mb-2" /><div className="text-2xl font-bold text-green-700">{activeCount}</div><div className="text-sm text-muted-foreground">Active</div></CardContent></Card>
          <Card><CardContent className="pt-5"><Send className="h-5 w-5 text-blue-500 mb-2" /><div className="text-2xl font-bold">{totalSent}</div><div className="text-sm text-muted-foreground">Total dispatched</div></CardContent></Card>
          <Card className="border-green-200 bg-green-50/40"><CardContent className="pt-5"><CheckCircle2 className="h-5 w-5 text-green-500 mb-2" /><div className="text-2xl font-bold text-green-700">{totalAccepted}</div><div className="text-sm text-muted-foreground">Accepted</div></CardContent></Card>
        </div>

        {integrations.isLoading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.data?.map((intg) => {
            const successRate = intg.totalSent > 0 ? Math.round((intg.totalAccepted / intg.totalSent) * 100) : null;
            return (
              <Card key={intg.id} className={intg.status === "active" ? "border-green-200" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[intg.status] ?? <WifiOff className="h-4 w-4 text-zinc-400" />}
                      <CardTitle className="text-base">{intg.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-xs ${STATUS_COLORS[intg.status] ?? ""}`}>
                        {intg.status.replace("_", " ")}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(intg)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{intg.apiEndpoint ?? "No endpoint configured"}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="text-lg font-bold">{intg.totalSent}</div>
                      <div className="text-[10px] text-muted-foreground">Sent</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2">
                      <div className="text-lg font-bold text-green-700">{intg.totalAccepted}</div>
                      <div className="text-[10px] text-muted-foreground">Accepted</div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2">
                      <div className="text-lg font-bold text-red-600">{intg.totalRejected}</div>
                      <div className="text-[10px] text-muted-foreground">Rejected</div>
                    </div>
                  </div>

                  {successRate !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Acceptance rate</span><span className="font-medium text-foreground">{successRate}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${successRate}%` }} />
                      </div>
                    </div>
                  )}

                  {intg.supportedTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {intg.supportedTypes.map((t) => (
                        <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full capitalize">{t}</span>
                      ))}
                    </div>
                  )}

                  {intg.notes && <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">{intg.notes}</p>}

                  {intg.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => pushAll.mutate({ id: intg.id })}
                      disabled={pushAll.isPending}
                    >
                      {pushAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Push pending leads
                    </Button>
                  )}

                  {intg.status === "pending_whitelist" && (
                    <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-700">
                      Waiting for IP whitelist approval from {intg.name}.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-dashed border-2 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors" onClick={() => setShowAdd(true)}>
            <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Add Bank / NBFC</p>
            <p className="text-xs text-muted-foreground mt-1">HDFC, SBI, Axis, ICICI, Bajaj…</p>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" />Coming Soon — Integration Catalogue</CardTitle>
            <CardDescription>One-click connect to major Indian banks and NBFCs. Enable each to start auto-dispatching leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "HDFC Bank", type: "Bank" },
                { name: "SBI", type: "Bank" },
                { name: "ICICI Bank", type: "Bank" },
                { name: "Axis Bank", type: "Bank" },
                { name: "Kotak Mahindra", type: "Bank" },
                { name: "Bajaj Finance", type: "NBFC" },
                { name: "L&T Finance", type: "NBFC" },
                { name: "Tata Capital", type: "NBFC" },
                { name: "Fullerton India", type: "NBFC" },
                { name: "Piramal Finance", type: "NBFC" },
                { name: "Shriram Finance", type: "NBFC" },
                { name: "Muthoot Finance", type: "NBFC" },
              ].map((b) => (
                <div key={b.name} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.type}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">Soon</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAdd && <AddIntegrationModal onClose={() => setShowAdd(false)} />}
      {editing && <EditModal integration={editing} onClose={() => setEditing(null)} />}
    </AdminLayout>
  );
}
