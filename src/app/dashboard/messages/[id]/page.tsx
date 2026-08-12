import { MessagesInbox } from "@/components/messages/messages-inbox";

export const metadata = { title: "Messages" };

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="hidden lg:block">
        <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat about offers — each thread shows whether you’re buying or selling.
        </p>
      </div>
      <MessagesInbox activeId={id} />
    </div>
  );
}
