/**
 * Renders a JSON-LD block.
 *
 * Lives in a component file rather than the SEO helpers so `lib/seo.ts` stays
 * JSX-free and importable from route handlers, the sitemap and tests.
 *
 * The `<` escape matters: a string inside the payload containing `</script>`
 * would otherwise close the tag early and inject markup. Everything here is
 * built server-side from our own objects, but the escape costs nothing and
 * removes the class of bug entirely.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
