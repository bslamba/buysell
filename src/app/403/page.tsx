import { Button } from "@/components/ui";

export const metadata = { title: "Not allowed" };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-32 text-center">
      <h1 className="text-2xl font-bold">You don&apos;t have access to this page</h1>
      <p className="mt-3 text-sm text-ink-500">
        If you think you should, ask an administrator to check your account role.
      </p>
      <div className="mt-8 flex justify-center"><Button href="/">Back to home</Button></div>
    </div>
  );
}
