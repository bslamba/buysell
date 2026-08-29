import { brand } from "@/config/brand";
import { PageHeader, Card, Eyebrow, Button } from "@/components/ui";

export const metadata = { title: "About" };

const BELIEFS = [
  { t: "The problem isn't listings. It's truth.", b: "India has no shortage of places to list a used phone — one of them has thirty million people a month. What none of them tell you is whether the thing in the photo is real, whether it's stolen, or whether the person selling it owns it. That gap is the entire business." },
  { t: "We never touch the goods.", b: "No warehouse, no inventory, no buying low and selling high. India's largest recommerce player turns over a thousand crore to keep about sixteen paise in the rupee. We'd rather verify a transaction than finance one." },
  { t: "Verification should be software, not vans.", b: "A person in a van can check one device at a time, in one city. A diagnostic that runs on the device itself checks any device, anywhere, instantly, for effectively nothing. That is the only version of this that reaches a Tier-3 town." },
  { t: "Rejecting an honest seller is the worst outcome.", b: "A fraudulent listing that slips through costs one dispute. A wrongly rejected honest seller never comes back and tells fifteen people. We track that number more closely than we track sales." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Somebody has to vouch for it"
        sub={`${brand.name} is built on a single idea: the reason people don't buy used online in India isn't price, and it isn't selection. It's that nobody will stand behind what's in the picture.`}
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {BELIEFS.map((x) => (
            <Card key={x.t} hover>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">{x.t}</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">{x.b}</p>
            </Card>
          ))}
        </div>

        <section className="mt-20">
          <Eyebrow>Where we are</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em]">
            Early access in Bengaluru, on purpose.
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-text-muted">
            A marketplace is only useful if things actually sell, and that needs density rather than
            reach. So we are starting in one corridor of one city — where the buyers, the sellers and
            the corporate hardware all sit within a few kilometres of each other — and we will not
            open a second city until listings here reliably sell within a fortnight.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/sell">Sell something</Button>
            <Button href="/contact" variant="glass">Talk to us</Button>
          </div>
        </section>

        <section className="mt-20">
          <Card>
            <Eyebrow>The company</Eyebrow>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-muted">
              {brand.name} is operated by <strong className="font-semibold text-text">{brand.legalName}</strong>,
              registered in Bengaluru. We are a marketplace: we never take ownership of anything listed
              here, and we charge buyers a protection fee rather than taking a commission from sellers.
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}
