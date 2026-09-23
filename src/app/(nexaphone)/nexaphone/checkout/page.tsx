import type { Metadata } from "next";
import Nav from "@/components/nexaphone/Nav";
import Checkout from "@/components/nexaphone/Checkout";

export const metadata: Metadata = { title: { absolute: "Checkout | Nexa Pro" } };

export default function CheckoutPage() {
  return (
    <>
      <Nav dock={false} />
      <main>
        <Checkout />
      </main>
    </>
  );
}
