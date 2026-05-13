import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PartnerLayout } from "@/components/partner-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Download, Eye, Loader2, RotateCcw, ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ParsedRow = {
  customerName: string;
  customerPhone: string;
  loanType: string;
  amount: number;
  tenure: number;
  valid: boolean;
  errors: string[];
};

type UploadResult = { row: number; status: "success" | "error"; message: string };

const LOAN_TYPES = ["personal", "home", "auto", "business", "education", "gold", "fd", "mutual_fund", "insurance"];

function parseCSV(text: string): ParsedRow[] {
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

    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) errors.push("Invalid phone (must be 10 digits)");
    if (!name) errors.push("Customer name required");
    if (!LOAN_TYPES.includes(type)) errors.push(`Unknown loan type: ${type}`);
    if (amount < 10000) errors.push("Amount must be ≥ ₹10,000");
    if (tenure < 3 || tenure > 360) errors.push("Tenure must be 3–360 months");

    return { customerName: name, customerPhone: phone, loanType: type, amount, tenure, valid: errors.length === 0, errors };
  });
}

const SAMPLE_CSV = `customer_name,phone,loan_type,amount,tenure
Rahul Sharma,9876543210,personal,500000,36
Priya Mehta,9123456780,home,2500000,120
Arjun Nair,9988776655,business,800000,48`;

export default function PartnerBulkUpload() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  function handleFile(file: File) {
    setResults([]);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0) {
        toast({ title: "No data found", description: "Make sure your CSV has a header row and data rows.", variant: "destructive" });
      } else {
        toast({ title: `Parsed ${parsed.length} rows`, description: `${parsed.filter((r) => r.valid).length} valid, ${parsed.filter((r) => !r.valid).length} with errors.` });
      }
    };
    reader.readAsText(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function submitAll() {
    setUploading(true);
    const res: UploadResult[] = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await api("/partner/leads", {
          method: "POST",
          body: JSON.stringify({
            customerName: row.customerName,
            customerPhone: row.customerPhone,
            loanType: row.loanType,
            amount: row.amount,
            tenureMonths: row.tenure,
          }),
        });
        res.push({ row: i + 1, status: "success", message: `${row.customerName} — lead created` });
      } catch (e: any) {
        res.push({ row: i + 1, status: "error", message: `${row.customerName} — ${e.message ?? "Failed"}` });
      }
    }
    setResults(res);
    setUploading(false);
    qc.invalidateQueries({ queryKey: ["partner", "leads"] });
    const ok = res.filter((r) => r.status === "success").length;
    toast({ title: `Upload complete`, description: `${ok}/${validRows.length} leads submitted successfully.` });
  }

  function reset() {
    setRows([]);
    setFileName("");
    setResults([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quikkk_bulk_upload_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Leads</h1>
            <p className="text-muted-foreground mt-1">Import multiple leads at once from a CSV file.</p>
          </div>
          <div className="flex gap-2">
            {rows.length > 0 && <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>}
            <Button variant="outline" onClick={downloadSample}><Download className="h-4 w-4 mr-2" />Sample CSV</Button>
          </div>
        </div>

        {rows.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload your CSV file</CardTitle>
              <CardDescription>
                Supported format: CSV. Required columns: <code className="font-mono text-xs bg-muted px-1 rounded">customer_name, phone, loan_type, amount, tenure</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
              >
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Drop your CSV here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">CSV files up to 10 MB</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              </div>

              <div className="mt-6 rounded-lg bg-muted/40 p-4">
                <div className="font-medium text-sm mb-2">Expected CSV format</div>
                <pre className="text-xs text-muted-foreground font-mono bg-zinc-950 text-zinc-100 rounded p-3 overflow-x-auto">{SAMPLE_CSV}</pre>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• <strong>loan_type</strong>: personal, home, auto, business, education, gold, fd, mutual_fund, insurance</div>
                  <div>• <strong>amount</strong>: in ₹, minimum ₹10,000</div>
                  <div>• <strong>tenure</strong>: in months (3 – 360)</div>
                  <div>• <strong>phone</strong>: 10-digit Indian mobile number</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rows.length > 0 && results.length === 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-5">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{rows.length}</div>
                  <div className="text-sm text-muted-foreground">Total rows in {fileName}</div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-5">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-700">{validRows.length}</div>
                  <div className="text-sm text-muted-foreground">Valid — ready to submit</div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-5">
                  <XCircle className="h-5 w-5 text-red-600 mb-2" />
                  <div className="text-2xl font-bold text-red-700">{invalidRows.length}</div>
                  <div className="text-sm text-muted-foreground">Rows with errors</div>
                </CardContent>
              </Card>
            </div>

            {invalidRows.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />Rows with errors (will be skipped)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {invalidRows.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{r.customerName || "(no name)"}</span> — {r.errors.join("; ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />Preview — valid rows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-muted-foreground">
                      <tr>
                        <th className="text-left py-2 pr-4">#</th>
                        <th className="text-left py-2 pr-4">Name</th>
                        <th className="text-left py-2 pr-4">Phone</th>
                        <th className="text-left py-2 pr-4">Type</th>
                        <th className="text-right py-2 pr-4">Amount</th>
                        <th className="text-right py-2">Tenure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 pr-4 font-medium">{r.customerName}</td>
                          <td className="py-2 pr-4 font-mono">{r.customerPhone}</td>
                          <td className="py-2 pr-4 capitalize"><Badge variant="outline">{r.loanType}</Badge></td>
                          <td className="py-2 pr-4 text-right">₹{r.amount.toLocaleString("en-IN")}</td>
                          <td className="py-2 text-right">{r.tenure} mo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={submitAll} disabled={validRows.length === 0 || uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? `Uploading…` : `Submit ${validRows.length} leads`}
                {!uploading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
              <CardDescription>
                {results.filter((r) => r.status === "success").length} of {results.length} leads submitted successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2 border ${r.status === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  {r.status === "success"
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <span>Row {r.row}: {r.message}</span>
                </div>
              ))}
              <div className="pt-3 flex justify-end gap-2">
                <Button variant="outline" onClick={reset}>Upload another file</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerLayout>
  );
}
