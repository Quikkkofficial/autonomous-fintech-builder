import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUp() {
  return (
    <PhoneOtpAuth
      mode="signup"
      title="Create your account"
      subtitle="Compare loans and credit cards in seconds"
      extraFields={(disabled) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quikkk-name" className="text-[#141414] font-medium text-sm">
              Full name
            </Label>
            <Input
              id="quikkk-name"
              type="text"
              placeholder="Your full name"
              disabled={disabled}
              className="border-gray-200 bg-[#F9FAFB] text-[#141414]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quikkk-email" className="text-[#141414] font-medium text-sm">
              Email <span className="text-[#6B7280] font-normal">(optional)</span>
            </Label>
            <Input
              id="quikkk-email"
              type="email"
              placeholder="you@example.com"
              disabled={disabled}
              className="border-gray-200 bg-[#F9FAFB] text-[#141414]"
            />
          </div>
        </div>
      )}
    />
  );
}
