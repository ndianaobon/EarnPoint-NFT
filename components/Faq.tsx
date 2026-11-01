import { FAQS } from "@/lib/site";

export function Faq({ limit }: { limit?: number }) {
  return (
    <div className="faq">
      {FAQS.slice(0, limit).map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
