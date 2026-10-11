import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { api, roleHomePath } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, Loader2, Phone, ShieldCheck, AlertTriangle } from "lucide-react";

const RESEND_SECONDS = 30;

type Step = "phone" | "otp";

export function PhoneOtpAuth({
  mode,
  title,
  subtitle,
  extraFields,
}: {
  mode: "signin" | "signup";
  title: string;
  subtitle: string;
  /** Rendered above the phone input on step 1 (e.g. name/email for signup). */
  extraFields?: (disabled: boolean) => React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const configured = isFirebaseConfigured();

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  const getRecaptcha = useCallback(() => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, "quikkk-recaptcha", {
      size: "invisible",
    });
    recaptchaRef.current = verifier;
    return verifier;
  }, []);

  const friendlyError = (e: any): string => {
    const code = String(e?.code ?? "");
    if (code.includes("invalid-phone-number")) return "Please enter a valid 10-digit mobile number.";
    if (code.includes("too-many-requests")) return "Too many attempts. Please try again in a few minutes.";
    if (code.includes("quota-exceeded")) return "SMS quota exceeded. Please try again later.";
    if (code.includes("invalid-verification-code")) return "Incorrect OTP. Please check and try again.";
    if (code.includes("code-expired")) return "This OTP has expired. Please request a new one.";
    if (code.includes("captcha-check-failed")) return "Security check failed. Please reload and try again.";
    return e?.message ?? "Something went wrong. Please try again.";
  };

  const collectExtra = (): Record<string, string> => {
    const out: Record<string, string> = {};
    if (mode === "signup") {
      const name = (document.getElementById("quikkk-name") as HTMLInputElement | null)?.value?.trim() ?? "";
      const email = (document.getElementById("quikkk-email") as HTMLInputElement | null)?.value?.trim() ?? "";
      if (name) out.name = name;
      if (email) out.email = email;
    }
    return out;
  };

  async function sendOtp() {
    setError(null);
    const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setSending(true);
    try {
      const verifier = getRecaptcha();
      const confirmation = await signInWithPhoneNumber(getFirebaseAuth(), `+91${digits}`, verifier);
      confirmationRef.current = confirmation;
      setPhone(digits);
      setOtp("");
      setStep("otp");
      setResendIn(RESEND_SECONDS);
    } catch (e: any) {
      setError(friendlyError(e));
      // reset invisible recaptcha so a retry works
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your phone.");
      return;
    }
    const confirmation = confirmationRef.current;
    if (!confirmation) {
      setError("Session expired. Please request a new OTP.");
      setStep("phone");
      return;
    }
    setVerifying(true);
    try {
      const cred = await confirmation.confirm(otp);
      const idToken = await cred.user.getIdToken();
      const extra = collectExtra();
      const me = await api<{ role?: string }>("/auth/session", {
        method: "POST",
        json: { idToken, ...extra },
      });
      await refresh();
      setLocation(roleHomePath((me as any)?.role));
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-dvh bg-muted/30 flex flex-col">
      <div className="p-4">
        <button
          type="button"
          onClick={() => (step === "otp" ? setStep("phone") : setLocation("/"))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#EB1414]/10 flex items-center justify-center mb-4">
              {step === "otp" ? (
                <ShieldCheck className="w-6 h-6 text-[#EB1414]" />
              ) : (
                <Phone className="w-6 h-6 text-[#EB1414]" />
              )}
            </div>
            <h1 className="text-[#141414] font-bold text-2xl">{step === "otp" ? "Enter OTP" : title}</h1>
            <p className="text-[#6B7280] text-sm mt-1.5">
              {step === "otp"
                ? `We sent a 6-digit code to +91 ${phone}`
                : subtitle}
            </p>
          </div>

          {!configured ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                Phone sign-in is not configured yet. The site owner needs to add the
                Firebase credentials to finish setup.
              </div>
            </div>
          ) : step === "phone" ? (
            <div className="space-y-4">
              {extraFields?.(sending)}
              <div className="space-y-2">
                <Label htmlFor="quikkk-phone" className="text-[#141414] font-medium text-sm">
                  Mobile number
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-[#F9FAFB] text-sm text-[#6B7280]">
                    +91
                  </span>
                  <Input
                    id="quikkk-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    disabled={sending}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    className="rounded-l-none border-gray-200 bg-[#F9FAFB] text-[#141414]"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50/50 border border-red-100 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                onClick={sendOtp}
                disabled={sending}
                className="w-full bg-[#EB1414] hover:bg-[#c91010] text-white font-semibold h-11"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {sending ? "Sending OTP…" : "Send OTP"}
              </Button>
              <p className="text-xs text-center text-[#6B7280]">
                {mode === "signin" ? (
                  <>New to Quikkk? <button type="button" onClick={() => setLocation("/sign-up")} className="text-[#EB1414] font-medium hover:underline">Create an account</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={() => setLocation("/sign-in")} className="text-[#EB1414] font-medium hover:underline">Sign in</button></>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={verifying}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="border-gray-200 bg-[#F9FAFB]" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50/50 border border-red-100 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                onClick={verifyOtp}
                disabled={verifying || otp.length !== 6}
                className="w-full bg-[#EB1414] hover:bg-[#c91010] text-white font-semibold h-11"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {verifying ? "Verifying…" : "Verify & continue"}
              </Button>
              <p className="text-xs text-center text-[#6B7280]">
                Didn't get the code?{" "}
                {resendIn > 0 ? (
                  <span>Resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sending}
                    className="text-[#EB1414] font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Invisible reCAPTCHA mount point */}
      <div id="quikkk-recaptcha" />
    </div>
  );
}
