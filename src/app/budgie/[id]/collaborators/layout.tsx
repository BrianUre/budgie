import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contributors",
};

export default function CollaboratorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
