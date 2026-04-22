import { useState } from "react";
import { useLocation } from "wouter";
import { useSendOtp, useVerifyOtp, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
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
        description: `For demo, your OTP is: ${res.devOtp}`,
        duration: 10000,
      });
    } catch (err) {
      toast({ title: "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    try {
      const user = await verifyOtp.mutateAsync({ data: { phone, otp } });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      
      if (user.kycStatus === "pending") {
        setLocation("/kyc");
      } else {
        setLocation("/dashboard");
      }
    } catch (err) {
      toast({ title: "Invalid OTP", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4">
            <LogoMark size={56} />
          </div>
          <CardTitle className="text-2xl">Welcome to Quikkk</CardTitle>
          <CardDescription>
            {step === "phone" ? "Enter your phone number to continue" : `Enter the OTP sent to ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground sm:text-sm">
                    +91
                  </span>
                  <Input
                    id="phone"
                    className="rounded-l-none"
                    placeholder="9999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={sendOtp.isPending}>
                {sendOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center tracking-widest text-lg"
                />
              </div>
              <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
                {verifyOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Login
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep("phone")}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
