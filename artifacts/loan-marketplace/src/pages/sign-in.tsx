import { PhoneOtpAuth } from "@/components/phone-otp-auth";

export default function SignIn() {
  return (
    <PhoneOtpAuth
      mode="signin"
      title="Welcome back"
      subtitle="Sign in with your mobile number to access your account"
    />
  );
}
