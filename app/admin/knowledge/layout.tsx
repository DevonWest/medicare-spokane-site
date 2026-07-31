import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

export const metadata: Metadata = {
  title: "Editorial Workspace",
  alternates: null,
  openGraph: null,
  twitter: null,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default function KnowledgeAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  return <div className="knowledge-admin-route">{children}</div>;
}
