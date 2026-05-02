import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSendOtp, useVerifyOtp, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Lock, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast({ title: "Invalid phone number", variant: "destructive" });
      return;
    }
    try {
      const res = await sendOtp.mutateAsync({ data: { phone } });
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: `Demo OTP: ${res.devOtp}`,
        duration: 10000,
      });
    } catch {
      toast({ title: "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    try {
      const user = (await verifyOtp.mutateAsync({ data: { phone, otp } })) as any;
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        toast({ title: "Access denied — admin only", variant: "destructive" });
        setStep("phone");
        setPhone("");
        setOtp("");
      }
    } catch {
      toast({ title: "Invalid OTP", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Quikkk</span>
          <span className="text-zinc-500 text-sm">/ Admin Portal</span>
        </div>
        <Link href="/">
          <button className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to site
          </button>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/15 border border-red-600/30 mb-4">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 text-xs font-semibold tracking-wider uppercase">Restricted Access</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Admin sign-in</h1>
            <p className="text-zinc-400 text-sm">
              {step === "phone"
                ? "Enter your registered admin phone number."
                : `Enter the 6-digit OTP sent to +91 ${phone}`}
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-300 text-sm">Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/15 bg-white/5 text-zinc-400 text-sm select-none">
                    +91
                  </span>
                  <Input
                    id="phone"
                    className="rounded-l-none bg-white/5 border-white/15 text-white placeholder:text-zinc-600 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                    placeholder="9000000001"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold"
                disabled={sendOtp.isPending || phone.length < 10}
              >
                {sendOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-zinc-500 font-medium mb-2 uppercase tracking-wider">Demo</p>
                <p className="text-sm font-mono text-zinc-300">9000000001 — Admin Demo</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-zinc-300 text-sm">One-Time Password</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center tracking-[0.4em] text-xl bg-white/5 border-white/15 text-white placeholder:text-zinc-600 focus-visible:border-red-500 focus-visible:ring-red-500/20 h-14"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11 font-semibold"
                disabled={verifyOtp.isPending || otp.length < 6}
              >
                {verifyOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Access Admin
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                onClick={() => { setStep("phone"); setOtp(""); }}
              >
                ← Back
              </Button>
            </form>
          )}
        </div>
      </div>

      <footer className="px-8 py-5 border-t border-white/10 text-center text-xs text-zinc-600">
        Quikkk Admin Portal — Mekyek Global Services Pvt Ltd · Authorised access only
      </footer>
    </div>
  );
}
