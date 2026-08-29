import { Button, Card, Eyebrow } from "@/components/ui";

export const metadata = { title: "Not allowed", robots: { index: false, follow: false } };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-32">
      <Card className="text-center">
        <Eyebrow>403</Eyebrow>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
          You don&apos;t have access to this page
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          If you think you should, ask an administrator to check your account role.
        </p>
        <div className="mt-8 flex justify-center"><Button href="/">Back to home</Button></div>
      </Card>
    </div>
  );
}
