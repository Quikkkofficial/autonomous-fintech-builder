import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Download, Eye, Loader2, RotateCcw, ArrowRight, Users, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatINR } from "@/lib/format";

const LOAN_TYPES = ["personal", "home", "auto", "business", "education", "gold", "fd", "mutual_fund", "insurance"];

type LoanRow = {
  customerName: string; customerPhone: string; loanType: string;
  amount: number; tenure: number; valid: boolean; errors: string[];
};
type CollRow = {
  customerName: string; customerPhone: string; outstanding: number;
  dpd: number; loanId: string; valid: boolean; errors: string[];
};
type Result = { row: number; status: "success" | "error"; message: string };

function parseLoanCSV(text: string): LoanRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
    const errors: string[] = [];
    const phone = obj.phone || obj.mobile || obj.phone_number || obj.customer_phone || "";
    const name = obj.name || obj.customer_name || obj.full_name || "";
    const type = (obj.loan_type || obj.type || obj.product || "personal").toLowerCase();
    const amount = Number(obj.amount || obj.loan_amount || 0);
    const tenure = Number(obj.tenure || obj.tenure_months || 12);
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) errors.push("Invalid phone (10 digits)");
    if (!name) errors.push("Customer name required");
    if (!LOAN_TYPES.includes(type)) errors.push(`Unknown loan type: ${type}`);
    if (amount < 10000) errors.push("Amount must be ≥ ₹10,000");
    if (tenure < 3 || tenure > 360) errors.push("Tenure 3–360 months");
    return { customerName: name, customerPhone: phone, loanType: type, amount, tenure, valid: errors.length === 0, errors };
  });
}

function parseCollCSV(text: string): CollRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
    const errors: string[] = [];
    const phone = obj.phone || obj.mobile || obj.customer_phone || "";
    const name = obj.name || obj.customer_name || "";
    const outstanding = Number(obj.outstanding || obj.outstanding_amount || obj.balance || 0);
    const dpd = Number(obj.dpd || obj.days_past_due || 0);
    const loanId = obj.loan_id || obj.application_id || obj.id || "";
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) errors.push("Invalid phone");
    if (!name) errors.push("Customer name required");
    if (outstanding <= 0) errors.push("Outstanding amount must be > 0");
    if (dpd < 0) errors.push("DPD must be ≥ 0");
    return { customerName: name, customerPhone: phone, outstanding, dpd, loanId, valid: errors.length === 0, errors };
  });
}

const LOAN_SAMPLE = `customer_name,phone,loan_type,amount,tenure
Rahul Sharma,9876543210,personal,500000,36
Priya Mehta,9123456780,home,2500000,120
Arjun Nair,9988776655,business,800000,48`;

const COLL_SAMPLE = `customer_name,phone,loan_id,outstanding,dpd
Vikram Singh,9811223344,APP-001,45000,35
Sunita Rao,9022334455,APP-002,120000,65
Mohan Lal,9744556677,APP-003,78500,15`;

function DropZone({ onFile, accept }: { onFile: (f: File) => void; accept: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
      onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => ref.current?.click()}
    >
      <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-lg font-medium">Drop your CSV here or click to browse</p>
      <p className="text-sm text-muted-foreground mt-1">CSV files only</p>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
    </div>
  );
}

function LoanUploadTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rows, setRows] = useState<LoanRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [uploading, setUploading] = useState(false);

  const valid = rows.filter((r) => r.valid);
  const invalid = rows.filter((r) => !r.valid);

  function handleFile(file: File) {
    setResults([]); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseLoanCSV(e.target?.result as string);
      setRows(parsed);
      if (!parsed.length) toast({ title: "No data found", variant: "destructive" });
      else toast({ title: `${parsed.length} rows parsed`, description: `${parsed.filter(r => r.valid).length} valid` });
    };
    reader.readAsText(file);
  }

  async function submit() {
    setUploading(true);
    const res: Result[] = [];
    for (let i = 0; i < valid.length; i++) {
      const r = valid[i];
      try {
        await api("/admin/lead-upload/loan", { method: "POST", json: { customerName: r.customerName, customerPhone: r.customerPhone, loanType: r.loanType, amount: r.amount, tenureMonths: r.tenure } });
        res.push({ row: i + 1, status: "success", message: `${r.customerName} — lead created` });
      } catch { res.push({ row: i + 1, status: "error", message: `${r.customerName} — failed` }); }
    }
    setResults(res);
    setUploading(false);
    qc.invalidateQueries({ queryKey: ["admin", "apps"] });
    const ok = res.filter(r => r.status === "success").length;
    toast({ title: `Upload complete`, description: `${ok}/${valid.length} submitted` });
  }

  function reset() { setRows([]); setFileName(""); setResults([]); }

  function download() {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([LOAN_SAMPLE], { type: "text/csv" })), download: "loan_leads_template.csv" });
    a.click();
  }

  return (
    <div className="space-y-5 pt-4">
      <div className="flex justify-end gap-2">
        {rows.length > 0 && <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>}
        <Button variant="outline" onClick={download}><Download className="h-4 w-4 mr-2" />Sample CSV</Button>
      </div>

      {rows.length === 0 && results.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Loan Leads CSV</CardTitle>
            <CardDescription>Required columns: <code className="font-mono text-xs bg-muted px-1 rounded">customer_name, phone, loan_type, amount, tenure</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DropZone onFile={handleFile} accept=".csv,.txt" />
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="font-medium text-sm mb-2">Supported loan types</div>
              <div className="flex flex-wrap gap-1.5">{LOAN_TYPES.map(t => <Badge key={t} variant="outline" className="text-xs capitalize">{t}</Badge>)}</div>
              <pre className="mt-3 text-xs text-zinc-100 bg-zinc-900 rounded p-3 overflow-x-auto">{LOAN_SAMPLE}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && results.length === 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-5"><FileSpreadsheet className="h-5 w-5 text-muted-foreground mb-2" /><div className="text-2xl font-bold">{rows.length}</div><div className="text-sm text-muted-foreground">{fileName}</div></CardContent></Card>
            <Card className="border-green-200 bg-green-50/50"><CardContent className="pt-5"><CheckCircle2 className="h-5 w-5 text-green-600 mb-2" /><div className="text-2xl font-bold text-green-700">{valid.length}</div><div className="text-sm text-muted-foreground">Ready to upload</div></CardContent></Card>
            <Card className="border-red-200 bg-red-50/50"><CardContent className="pt-5"><XCircle className="h-5 w-5 text-red-600 mb-2" /><div className="text-2xl font-bold text-red-700">{invalid.length}</div><div className="text-sm text-muted-foreground">Rows with errors</div></CardContent></Card>
          </div>
          {invalid.length > 0 && (
            <Card className="border-red-200">
              <CardHeader><CardTitle className="text-base text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Errors (will be skipped)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {invalid.map((r, i) => <div key={i} className="flex items-start gap-2 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"><XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /><span><strong>{r.customerName || "(no name)"}</strong> — {r.errors.join("; ")}</span></div>)}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" />Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-muted-foreground"><tr><th className="text-left py-2 pr-4">#</th><th className="text-left py-2 pr-4">Name</th><th className="text-left py-2 pr-4">Phone</th><th className="text-left py-2 pr-4">Type</th><th className="text-right py-2 pr-4">Amount</th><th className="text-right py-2">Tenure</th></tr></thead><tbody>{valid.map((r, i) => <tr key={i} className="border-b last:border-0"><td className="py-2 pr-4 text-muted-foreground">{i+1}</td><td className="py-2 pr-4 font-medium">{r.customerName}</td><td className="py-2 pr-4 font-mono">{r.customerPhone}</td><td className="py-2 pr-4"><Badge variant="outline" className="capitalize">{r.loanType}</Badge></td><td className="py-2 pr-4 text-right">{formatINR(r.amount)}</td><td className="py-2 text-right">{r.tenure} mo</td></tr>)}</tbody></table></div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={submit} disabled={!valid.length || uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : `Submit ${valid.length} leads`}
              {!uploading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Results</CardTitle><CardDescription>{results.filter(r => r.status === "success").length}/{results.length} submitted</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {results.map((r, i) => <div key={i} className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 border ${r.status === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>{r.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}<span>Row {r.row}: {r.message}</span></div>)}
            <div className="pt-3 flex justify-end"><Button variant="outline" onClick={reset}>Upload another</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CollectionUploadTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rows, setRows] = useState<CollRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [uploading, setUploading] = useState(false);

  const valid = rows.filter((r) => r.valid);
  const invalid = rows.filter((r) => !r.valid);

  function handleFile(file: File) {
    setResults([]); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCollCSV(e.target?.result as string);
      setRows(parsed);
      if (!parsed.length) toast({ title: "No data found", variant: "destructive" });
      else toast({ title: `${parsed.length} rows parsed`, description: `${parsed.filter(r => r.valid).length} valid` });
    };
    reader.readAsText(file);
  }

  async function submit() {
    setUploading(true);
    const res: Result[] = [];
    for (let i = 0; i < valid.length; i++) {
      const r = valid[i];
      try {
        await api("/admin/lead-upload/collection", { method: "POST", json: { customerName: r.customerName, customerPhone: r.customerPhone, outstandingAmount: r.outstanding, dpd: r.dpd, loanId: r.loanId } });
        res.push({ row: i + 1, status: "success", message: `${r.customerName} — case created` });
      } catch { res.push({ row: i + 1, status: "error", message: `${r.customerName} — failed` }); }
    }
    setResults(res);
    setUploading(false);
    qc.invalidateQueries({ queryKey: ["admin", "apps"] });
    const ok = res.filter(r => r.status === "success").length;
    toast({ title: `Upload complete`, description: `${ok}/${valid.length} cases created` });
  }

  function reset() { setRows([]); setFileName(""); setResults([]); }

  function download() {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([COLL_SAMPLE], { type: "text/csv" })), download: "collection_cases_template.csv" });
    a.click();
  }

  return (
    <div className="space-y-5 pt-4">
      <div className="flex justify-end gap-2">
        {rows.length > 0 && <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>}
        <Button variant="outline" onClick={download}><Download className="h-4 w-4 mr-2" />Sample CSV</Button>
      </div>

      {rows.length === 0 && results.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Collection Cases CSV</CardTitle>
            <CardDescription>Required: <code className="font-mono text-xs bg-muted px-1 rounded">customer_name, phone, outstanding, dpd</code> — optional: <code className="font-mono text-xs bg-muted px-1 rounded">loan_id</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DropZone onFile={handleFile} accept=".csv,.txt" />
            <div className="rounded-lg bg-muted/40 p-4">
              <div className="font-medium text-sm mb-2">DPD bucket guidance</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[["1–30 DPD", "Early", "yellow"], ["31–60 DPD", "Standard", "orange"], ["61–90 DPD", "High", "red"], ["90+ DPD", "NPA risk", "red"]].map(([b, l, c]) => (
                  <div key={b} className={`rounded-lg border border-${c}-200 bg-${c}-50/40 px-3 py-2`}><div className="font-medium text-xs">{b}</div><div className="text-[10px] text-muted-foreground">{l}</div></div>
                ))}
              </div>
              <pre className="mt-3 text-xs text-zinc-100 bg-zinc-900 rounded p-3 overflow-x-auto">{COLL_SAMPLE}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && results.length === 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-5"><Users className="h-5 w-5 text-muted-foreground mb-2" /><div className="text-2xl font-bold">{rows.length}</div><div className="text-sm text-muted-foreground">{fileName}</div></CardContent></Card>
            <Card className="border-green-200 bg-green-50/50"><CardContent className="pt-5"><CheckCircle2 className="h-5 w-5 text-green-600 mb-2" /><div className="text-2xl font-bold text-green-700">{valid.length}</div><div className="text-sm text-muted-foreground">Ready to import</div></CardContent></Card>
            <Card className="border-red-200 bg-red-50/50"><CardContent className="pt-5"><XCircle className="h-5 w-5 text-red-600 mb-2" /><div className="text-2xl font-bold text-red-700">{invalid.length}</div><div className="text-sm text-muted-foreground">Rows with errors</div></CardContent></Card>
          </div>
          {invalid.length > 0 && (
            <Card className="border-red-200">
              <CardHeader><CardTitle className="text-base text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Errors</CardTitle></CardHeader>
              <CardContent className="space-y-2">{invalid.map((r, i) => <div key={i} className="flex items-start gap-2 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"><XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /><span><strong>{r.customerName || "(no name)"}</strong> — {r.errors.join("; ")}</span></div>)}</CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" />Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-muted-foreground"><tr><th className="text-left py-2 pr-4">#</th><th className="text-left py-2 pr-4">Name</th><th className="text-left py-2 pr-4">Phone</th><th className="text-right py-2 pr-4">Outstanding</th><th className="text-right py-2 pr-4">DPD</th><th className="text-left py-2">Loan ID</th></tr></thead><tbody>{valid.map((r, i) => <tr key={i} className="border-b last:border-0"><td className="py-2 pr-4 text-muted-foreground">{i+1}</td><td className="py-2 pr-4 font-medium">{r.customerName}</td><td className="py-2 pr-4 font-mono">{r.customerPhone}</td><td className="py-2 pr-4 text-right">{formatINR(r.outstanding)}</td><td className="py-2 pr-4 text-right"><span className={r.dpd > 60 ? "text-red-600 font-semibold" : r.dpd > 30 ? "text-orange-600" : ""}>{r.dpd}</span></td><td className="py-2 text-xs text-muted-foreground">{r.loanId || "—"}</td></tr>)}</tbody></table></div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={submit} disabled={!valid.length || uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
              {uploading ? "Importing…" : `Import ${valid.length} cases`}
              {!uploading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Results</CardTitle><CardDescription>{results.filter(r => r.status === "success").length}/{results.length} imported</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {results.map((r, i) => <div key={i} className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 border ${r.status === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>{r.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}<span>Row {r.row}: {r.message}</span></div>)}
            <div className="pt-3 flex justify-end"><Button variant="outline" onClick={reset}>Upload another</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminLeadUpload() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Upload</h1>
          <p className="text-muted-foreground mt-1">Bulk import loan leads or collection cases via CSV. Supports drag-and-drop.</p>
        </div>
        <Tabs defaultValue="loan">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="loan" className="gap-2"><FileSpreadsheet className="h-4 w-4" />Loan Leads</TabsTrigger>
            <TabsTrigger value="collection" className="gap-2"><AlertCircle className="h-4 w-4" />Collection Cases</TabsTrigger>
          </TabsList>
          <TabsContent value="loan"><LoanUploadTab /></TabsContent>
          <TabsContent value="collection"><CollectionUploadTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
