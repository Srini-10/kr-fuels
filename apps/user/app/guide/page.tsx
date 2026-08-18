import type { Metadata } from "next";
import Link from "next/link";
import { Fuel, Flame, HelpCircle } from "lucide-react";
import { getFaq } from "@/lib/api";
import { normalizeUrl } from "@kr/shared/lib/utils";
import { FAQ_FALLBACK } from "@/lib/fallbacks";

export const metadata: Metadata = {
  title: "Guide — Auto LPG vs Domestic LPG",
  description: "Auto LPG vs Domestic LPG compared, and frequently asked questions about switching.",
};

// ISR: FAQ/settings change infrequently — serve from cache, refresh in background.
export const revalidate = 120;

// Auto LPG vs Domestic LPG — full technical comparison. Rows are [Auto LPG, Parameter, Domestic LPG].
const COMPARISON: [string, string, string][] = [
  ["BIS - 14861", "Grade", "BIS - 4576"],
  ["< 0.1 % Vol", "Ethane", "4 % Vol"],
  ["40 % Vol", "Propane", "15 % Vol"],
  ["60 % Vol", "N Butane & Iso Butane", "80% Vol"],
  ["0 % Vol", "Other heavier hydrocarbons", "1 % Vol"],
  ["Upto 550 Kg/Cu M", "Density @ 15 C", "Upto 580 Kg/Cu M"],
  ["Upto 7 bar", "Vapour pressure @ 40 C", "Upto 7 bar"],
  ["93 +", "Motor octane number", "60 +"],
  ["Nil", "Free water content", "Nil"],
  ["Passed the test", "Hydrogen sulphide", "Passed the test"],
  [
    "Smooth and excellent pickup similar to running on petrol. Over 26 million vehicles run on auto LPG worldwide. Third most used automotive fuel globally.",
    "Driving comfort",
    "No comfort in driving, low pickup and possibility of presence of sludges causes erratic fuel supply that compromises performance of the vehicle, leads to engine failure.",
  ],
  [
    "Fuelling in LPG stations is very safe",
    "Mode of fuelling",
    "Very unsafe and crude method. Possibility of fire while transferring LPG from cylinder to vehicle tank which is illegal.",
  ],
  [
    "Low maintenance cost due to high octane",
    "Maintenance cost of vehicle",
    "Consists impurities and low octane value. Hence maintenance cost is higher than Auto LPG.",
  ],
  ["More than 220 LPG bunks are available in Tamil Nadu.", "Availability", "------"],
  ["30 ltrs per minute & same as petrol.", "Filling time", "Extremely risky and also illegal"],
  [
    "Suitable for all types of LPG conversion kits.",
    "Suitability",
    "Not suitable for sequential and liquid injection conversion kits.",
  ],
];

export default async function GuidePage() {
  const faq = await getFaq();
  // Real FAQ from the backend wins; fall back to common questions when empty.
  const faqList = faq.length ? faq : FAQ_FALLBACK;

  return (
    <>
      {/* <section className="bg-gradient-to-b from-brand-pale/60 to-white">
        <div className="container-x py-14 text-center">
          <span className="eyebrow mb-4">Guide</span>
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">Everything About Auto LPG</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-mutedfg">
            Understand the savings, the environmental impact and how Auto LPG differs from domestic LPG.
          </p>
        </div>
      </section> */}

      {/* Auto LPG vs Domestic LPG — full technical comparison table */}
      <section className="container-x py-16">
        <div className="mb-8 text-center">
          <span className="eyebrow mb-4">Guide</span>
          <h2 className="section-title">Auto LPG vs Domestic LPG</h2>
          <p className="mx-auto mt-3 max-w-2xl text-mutedfg">
            They share a name, but they are engineered for entirely different jobs. Here&apos;s how they compare.
          </p>
        </div>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_18px_rgba(13,26,16,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 border-collapse text-sm">
              <thead>
                <tr>
                  {/* Auto LPG — the featured / recommended column */}
                  <th className="w-1/3 bg-brand px-4 py-5 text-center align-bottom">
                    <span className="inline-flex items-center justify-center gap-2 text-base font-extrabold text-white">
                      <Fuel size={18} /> Auto LPG
                    </span>
                    <span className="mt-2 block">
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                        Recommended
                      </span>
                    </span>
                  </th>
                  {/* Parameters — the comparison spine */}
                  <th className="w-1/3 bg-cream px-4 py-5 text-center align-middle text-xs font-bold uppercase tracking-wider text-mutedfg">
                    Parameters
                  </th>
                  {/* Domestic LPG */}
                  <th className="w-1/3 border-l border-line bg-yellow-500 px-4 py-5 text-center align-middle">
                    <span className="inline-flex items-center justify-center gap-2 text-base font-extrabold text-ink">
                      <Flame size={18} className="text-yellow-800" /> Domestic LPG
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([auto, param, domestic]) => (
                  <tr key={param} className="border-t border-line">
                    <td className="border-r border-brand/10 bg-brand/5 px-4 py-3.5 text-center align-middle font-semibold leading-relaxed text-ink">
                      {auto}
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle font-semibold leading-relaxed text-ink">
                      {param}
                    </td>
                    <td className="border-l border-yellow-500/10 bg-yellow-400/10 px-4 py-3.5 text-center align-middle leading-relaxed text-ink">
                      {domestic}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x py-16">
        <div className="mb-8 text-center">
          <span className="grid mx-auto mb-3 h-11 w-11 place-items-center rounded-xl bg-brand-pale text-brand"><HelpCircle size={20} /></span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqList.length === 0 ? (
            <p className="text-center text-mutedfg">FAQs will appear here soon.</p>
          ) : (
            faqList.map((f) => (
              <details key={f.id} className="card-soft group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 leading-snug">{f.question}</span>
                  <span className="mt-0.5 shrink-0 text-xl leading-none text-brand transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <div className="mt-3 text-sm leading-relaxed text-mutedfg">
                  {f.isLink ? (
                    <Link href={normalizeUrl(f.answer)} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline break-words">{f.answer}</Link>
                  ) : (
                    <p className="whitespace-pre-line break-words">{f.answer}</p>
                  )}
                </div>
              </details>
            ))
          )}
        </div>
      </section>
    </>
  );
}
