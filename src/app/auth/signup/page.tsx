import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex items-center px-4 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
