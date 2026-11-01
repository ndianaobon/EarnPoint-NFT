import type { Metadata } from "next";
import { ExploreClient } from "@/components/ExploreClient";
import { LiveNfts } from "@/components/LiveNfts";
import { Notice, PageHead } from "@/components/Notice";

export const metadata: Metadata = { title: "Explore NFTs" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  return (
    <>
      <div className="container page">
        <PageHead eyebrow="Marketplace" title="Explore NFTs">
          Search and filter by price, collection, category and blockchain.
        </PageHead>
        <Notice>
          These items are for preview only. They aren't real offers and can't be bought yet.
        </Notice>
        <ExploreClient initialQuery={typeof q === "string" ? q : ""} />
      </div>
      <LiveNfts limit={8} soft />
    </>
  );
}
