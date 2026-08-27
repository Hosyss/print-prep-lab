import type { Metadata } from "next";
import { HomeDashboard } from "@/components/home-dashboard";
import { pageMetadata } from "@/lib/seo";

const homeMetadata = pageMetadata({
  title: "Print Size, Pixel and Image Resolution Tools | Print Prep Lab",
  description: "Check image quality, calculate print dimensions, preview cropping and prepare bleed with free browser-based print tools.",
  path: "/",
});

export const metadata: Metadata = {
  ...homeMetadata,
  title: { absolute: "Print Size, Pixel and Image Resolution Tools | Print Prep Lab" },
};

export default function Home() {
  return <HomeDashboard />;
}
