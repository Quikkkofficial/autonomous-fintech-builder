import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AdminUser = { id: number; phone: string; name: string | null; email: string | null; role: string; partnerCode: string | null; kycStatus: string; createdAt: string };

const ROLE_OPTS = ["customer", "admin", "sales_partner", "collection_partner"];

export default function AdminUsers() {
  const [role, setRole] = useState<string>("all");
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const users = useQuery({
    queryKey: ["admin", "users", role, q],
    queryFn: () => {
      const params = new URLSearchParams();
      if (role !== "all") params.set("role", role);
      if (q) params.set("q", q);
      return api<AdminUser[]>(`/admin/users?${params}`);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api(`/admin/users/${id}`, { method: "PATCH", json: { role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Role updated" });
    },
    onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage all platform users and assign roles.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Search by name, phone, email or partner code" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLE_OPTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {users.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Partner Code</th>
                    <th className="py-2 pr-4">KYC</th>
                    <th className="py-2 pr-4">Joined</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-4 text-muted-foreground">#{u.id}</td>
                      <td className="py-2 pr-4 font-medium">{u.name ?? "—"}</td>
                      <td className="py-2 pr-4">{u.phone}</td>
                      <td className="py-2 pr-4">{u.email ?? "—"}</td>
                      <td className="py-2 pr-4"><Badge variant="outline">{u.role}</Badge></td>
                      <td className="py-2 pr-4 text-xs">{u.partnerCode ?? "—"}</td>
                      <td className="py-2 pr-4"><Badge variant={u.kycStatus === "verified" ? "default" : "secondary"}>{u.kycStatus}</Badge></td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Select value={u.role} onValueChange={(v) => updateRole.mutate({ id: u.id, role: v })}>
                          <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {users.data?.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
