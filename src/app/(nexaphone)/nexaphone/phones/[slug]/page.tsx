import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/nexaphone/Nav";
import DevicePage from "@/components/nexaphone/DevicePage";
import { fromPrice, money, productBySlug, products } from "@/components/nexaphone/catalog";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = productBySlug(params.slug);
  if (!p) return {};
  return {
    title: { absolute: `${p.name} | Nexa Pro` },
    description: `${p.headline} ${p.chip} flagship. From ${money(fromPrice(p))}.`,
  };
}

export default function PhonePage({ params }: { params: { slug: string } }) {
  if (!productBySlug(params.slug)) notFound();
  return (
    <>
      <Nav dock={false} />
      <main>
        <DevicePage slug={params.slug} />
      </main>
    </>
  );
}
