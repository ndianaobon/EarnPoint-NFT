"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, CHAINS, COLLECTIONS, NFTS } from "@/lib/nfts";
import { SearchIcon } from "./Icons";
import { NftCard } from "./NftCard";

const SORTS = {
  featured: "Featured",
  low: "Price: low to high",
  high: "Price: high to low",
  name: "Name",
};

export function ExploreClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [collection, setCollection] = useState("");
  const [category, setCategory] = useState("");
  const [chain, setChain] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("featured");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = NFTS.filter(
      (n) =>
        (!q || `${n.name} ${n.collection} ${n.token}`.toLowerCase().includes(q)) &&
        (!collection || n.collection === collection) &&
        (!category || n.category === category) &&
        (!chain || n.chain === chain) &&
        (min === "" || (n.priceUsdt !== null && n.priceUsdt >= Number(min))) &&
        (max === "" || (n.priceUsdt !== null && n.priceUsdt <= Number(max))),
    );
    // Unpriced artwork always sorts after anything with a price.
    if (sort === "low") {
      return [...list].sort((a, b) => (a.priceUsdt ?? Infinity) - (b.priceUsdt ?? Infinity));
    }
    if (sort === "high") {
      return [...list].sort((a, b) => (b.priceUsdt ?? -1) - (a.priceUsdt ?? -1));
    }
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, collection, category, chain, min, max, sort]);

  const clear = () => {
    setQuery("");
    setCollection("");
    setCategory("");
    setChain("");
    setMin("");
    setMax("");
    setSort("featured");
  };

  return (
    <>
      <div className="filters">
        <label className="field field-search">
          Search
          <span className="search-bar">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="NFT or collection"
            />
          </span>
        </label>
        <label className="field">
          Collection
          <select className="input" value={collection} onChange={(e) => setCollection(e.target.value)}>
            <option value="">All</option>
            {COLLECTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          Category
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          Blockchain
          <select className="input" value={chain} onChange={(e) => setChain(e.target.value)}>
            <option value="">All</option>
            {CHAINS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          Min USDT
          <input className="input" type="number" min="0" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
        <label className="field">
          Max USDT
          <input className="input" type="number" min="0" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
        <label className="field">
          Sort by
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}>
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="result-count" aria-live="polite">
        {results.length} preview {results.length === 1 ? "item" : "items"}
      </p>

      {results.length > 0 ? (
        <div className="nft-grid">
          {results.map((nft) => <NftCard key={nft.id} nft={nft} />)}
        </div>
      ) : (
        <div className="empty">
          <SearchIcon size={30} />
          <h3>No listings match your filters</h3>
          <p>Try a different search or remove some filters.</p>
          <button type="button" className="btn btn-ghost" onClick={clear}>Clear filters</button>
        </div>
      )}
    </>
  );
}
