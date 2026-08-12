import { StartupCreateFlow } from "@/components/dashboard/startup-create-flow";

export const metadata = { title: "Add startup" };

export default function NewStartupPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <StartupCreateFlow />
    </div>
  );
}
