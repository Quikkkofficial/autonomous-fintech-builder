import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSendOtp, useVerifyOtp, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Handshake, TrendingUp, ArrowLeft, ArrowRight, PhoneCall, Users2 } from "lucide-react";

type PartnerType = "channel" | "collection";

export default function PartnerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [partnerType, setPartnerType] = useState<PartnerType>("channel");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"select" | "phone" | "otp">("select");

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
      const role = user.role;
      if (role === "sales_partner") {
        setLocation("/partner");
      } else if (role === "collection_partner") {
        setLocation("/collection");
      } else {
        toast({ title: "Access denied — partner accounts only", variant: "destructive" });
        setStep("phone");
        setPhone("");
        setOtp("");
      }
    } catch {
      toast({ title: "Invalid OTP", variant: "destructive" });
    }
  };

  const isChannel = partnerType === "channel";
  const accent = isChannel ? "indigo" : "amber";
  const accentClasses = {
    bg: isChannel ? "bg-indigo-600" : "bg-amber-500",
    hover: isChannel ? "hover:bg-indigo-700" : "hover:bg-amber-600",
    border: isChannel ? "border-indigo-500" : "border-amber-400",
    ring: isChannel ? "focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20" : "focus-visible:border-amber-500 focus-visible:ring-amber-500/20",
    text: isChannel ? "text-indigo-600" : "text-amber-600",
    badge: isChannel ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-amber-50 border-amber-200 text-amber-700",
    selectedCard: isChannel ? "border-indigo-500 bg-indigo-50" : "border-amber-400 bg-amber-50",
    gradient: isChannel
      ? "from-indigo-600 via-indigo-700 to-blue-900"
      : "from-amber-500 via-amber-600 to-orange-700",
  };

  const demoPhone = isChannel ? "9000000002" : "9000000003";
  const demoLabel = isChannel ? "Sales Partner Demo" : "Collection Demo";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className={`hidden lg:flex lg:w-[42%] bg-gradient-to-br ${accentClasses.gradient} flex-col justify-between p-12 text-white`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            {isChannel ? <Handshake className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
          </div>
          <div>
            <span className="font-bold text-xl">Quikkk</span>
            <span className="text-white/60 text-sm ml-2">
              {isChannel ? "Channel Partner" : "Collection Partner"}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-4">
              {isChannel ? "Why partner with us?" : "Collection tools"}
            </div>
            {isChannel ? (
              <ul className="space-y-4">
                {[
                  "Earn 1.2% commission on every disbursed loan",
                  "Submit and track leads in real-time",
                  "Bulk upload leads via CSV or API",
                  "Omni-channel campaign links & QR codes",
                  "Real-time payout dashboard",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-[10px]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-4">
                {[
                  "DPD-bucketed case queue with SLA tracking",
                  "Omni-channel: call, SMS, WhatsApp, email, visit",
                  "Log follow-ups with promise-to-pay capture",
                  "Record partial and full payment recovery",
                  "API & webhook integration with dialers/CRMs",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-[10px]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur p-6 space-y-3">
            {isChannel ? (
              <>
                <div className="text-3xl font-bold">₹2,400Cr+</div>
                <div className="text-white/60 text-sm">loans disbursed through partners</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">93%</div>
                <div className="text-white/60 text-sm">recovery rate on assigned cases</div>
              </>
            )}
          </div>
        </div>

        <p className="text-white/40 text-xs">
          Mekyek Global Services Pvt Ltd · Partners programme
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="px-8 py-5 flex items-center justify-between border-b">
          <Link href="/">
            <button className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Quikkk.in
            </button>
          </Link>
          <span className="text-xs text-muted-foreground">
            Customer?{" "}
            <Link href="/login" className={`font-medium ${accentClasses.text} hover:underline`}>
              Sign in here
            </Link>
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            {step === "select" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Partner portal</h1>
                  <p className="text-muted-foreground mt-2">Select your partner type to continue.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPartnerType("channel")}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      partnerType === "channel"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-border hover:border-indigo-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${partnerType === "channel" ? "bg-indigo-100" : "bg-muted"}`}>
                      <Handshake className={`w-5 h-5 ${partnerType === "channel" ? "text-indigo-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="font-semibold text-sm">Channel Partner</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sourcing & sales</div>
                  </button>
                  <button
                    onClick={() => setPartnerType("collection")}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${
                      partnerType === "collection"
                        ? "border-amber-400 bg-amber-50"
                        : "border-border hover:border-amber-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${partnerType === "collection" ? "bg-amber-100" : "bg-muted"}`}>
                      <PhoneCall className={`w-5 h-5 ${partnerType === "collection" ? "text-amber-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="font-semibold text-sm">Collection Partner</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Recovery & collections</div>
                  </button>
                </div>

                <Button
                  className={`w-full h-12 font-semibold ${accentClasses.bg} ${accentClasses.hover} text-white gap-2`}
                  onClick={() => setStep("phone")}
                >
                  Continue as {isChannel ? "Channel Partner" : "Collection Partner"}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demo accounts</p>
                  <div className="space-y-1 font-mono text-xs text-foreground/70">
                    <div>9000000002 — Channel Partner (QSP-00001)</div>
                    <div>9000000003 — Collection Partner (QCP-00001)</div>
                  </div>
                </div>
              </>
            )}

            {step === "phone" && (
              <>
                <div>
                  <button
                    onClick={() => { setStep("select"); setPhone(""); }}
                    className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change partner type
                  </button>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${accentClasses.badge}`}>
                    {isChannel ? <Handshake className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
                    {isChannel ? "Channel Partner" : "Collection Partner"} login
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">Enter your phone</h1>
                  <p className="text-muted-foreground text-sm mt-1">We'll send a one-time password to verify your identity.</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm select-none">
                        +91
                      </span>
                      <Input
                        id="phone"
                        className={`rounded-l-none ${accentClasses.ring}`}
                        placeholder={demoPhone}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full h-11 font-semibold ${accentClasses.bg} ${accentClasses.hover} text-white`}
                    disabled={sendOtp.isPending || phone.length < 10}
                  >
                    {sendOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send OTP
                  </Button>
                </form>

                <div className="rounded-xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Demo: <span className="font-mono">{demoPhone}</span> — {demoLabel}</p>
                </div>
              </>
            )}

            {step === "otp" && (
              <>
                <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${accentClasses.badge}`}>
                    {isChannel ? <Handshake className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
                    {isChannel ? "Channel Partner" : "Collection Partner"} OTP
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">Check your messages</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter the 6-digit OTP sent to +91 {phone}
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={`text-center tracking-[0.4em] text-xl h-14 ${accentClasses.ring}`}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className={`w-full h-11 font-semibold ${accentClasses.bg} ${accentClasses.hover} text-white`}
                    disabled={verifyOtp.isPending || otp.length < 6}
                  >
                    {verifyOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setStep("phone"); setOtp(""); }}
                  >
                    ← Back
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
