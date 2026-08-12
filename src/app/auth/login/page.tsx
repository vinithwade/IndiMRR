import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex items-center px-4 py-16">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
