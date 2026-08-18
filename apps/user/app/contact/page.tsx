import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Mail, Phone, MessageCircle } from "lucide-react";
import { getContact, getSiteSettings, getStations } from "@/lib/api";
import { ContactPanels } from "@/components/ContactPanels";
import { resolveSocials } from "@/components/SocialIcons";
import { BRAND, formatAddress, getCoords } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with K.R Trans Fuels — phone, email, address and enquiry form.",
};

// ISR: contact details rarely change — long cache, background refresh.
export const revalidate = 300;

export default async function ContactPage() {
  const [contact, site, stations] = await Promise.all([getContact(), getSiteSettings(), getStations()]);
  // Official brand icons, canonical order, blank/placeholder admin values dropped.
  const socials = resolveSocials(site.social);

  const companyName = contact.essentials?.companyName || BRAND.name;
  const email = contact.essentials?.emails?.info || BRAND.email;
  const phone = contact.essentials?.phoneNos?.office || BRAND.phone;
  const whatsapp = contact.essentials?.phoneNos?.whatsapp;
  const address = formatAddress(contact.presents?.address);
  // Prefer the coordinates the admin stored (presents.exactLocation); otherwise fall
  // back to the brand HQ coordinates so the map always pins the real office location
  // rather than a fuzzy name+address text search.
  const coords = getCoords(contact.presents) ?? { latitude: BRAND.coords.lat, longitude: BRAND.coords.lng };
  const mapQuery = `${coords.latitude},${coords.longitude}`;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;

  const info = [
    { icon: MapPin, label: "Address", value: address },
    { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    { icon: Phone, label: "Phone", value: phone, href: `tel:${phone}` },
    ...(whatsapp ? [{ icon: MessageCircle, label: "WhatsApp", value: whatsapp, href: `https://wa.me/${String(whatsapp).replace(/[^0-9]/g, "")}` }] : []),
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-brand-pale/60 to-white">
        <div className="container-x py-14 text-center">
          <span className="eyebrow mb-4">Contact</span>
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">We&apos;d love to hear from you</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-mutedfg">
            Questions about Auto LPG, stations or conversions — or feedback on a station you visited?
            Reach out, we&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          {/* ── Contact info ───────────────────────────────────── */}
          <div className="space-y-6">
            <div className="card-soft">
              <h2 className="text-xl font-extrabold text-ink">Get in touch</h2>
              <p className="mt-1 text-sm text-mutedfg">Reach us by phone, email or drop by — we&apos;re happy to help.</p>

              {/* Quick actions */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link href={`tel:${phone}`} className="btn-primary justify-center"><Phone size={16} /> Call Now</Link>
                {whatsapp ? (
                  <Link href={`https://wa.me/${String(whatsapp).replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center"><MessageCircle size={16} className="text-brand" /> WhatsApp</Link>
                ) : (
                  <Link href={`mailto:${email}`} className="btn-outline justify-center"><Mail size={16} className="text-brand" /> Email Us</Link>
                )}
              </div>

              {/* Detail rows */}
              <div className="mt-6 divide-y divide-line">
                {info.map((c) => (
                  <div key={c.label} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand"><c.icon size={20} /></span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wider text-mutedfg">{c.label}</div>
                      {c.href ? (
                        <Link href={c.href} className="font-medium text-ink break-words hover:text-brand">{c.value}</Link>
                      ) : (
                        <div className="font-medium text-ink break-words">{c.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Socials */}
            {socials.length > 0 && (
              <div className="card-soft">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-mutedfg">Follow us</div>
                <div className="flex flex-wrap gap-3">
                  {socials.map(({ key, label, url, color, Icon }) => (
                    <Link
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      style={{ ["--brand-social" as string]: color }}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-pale px-4 py-2.5 text-sm font-semibold text-(--brand-social) transition hover:bg-(--brand-social) hover:text-white"
                    >
                      <Icon size={18} /> {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Enquiry / Feedback panels ──────────────────────── */}
          <ContactPanels stations={stations.data} />
        </div>

        {/* ── Full-width location map (spans both columns) ────── */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-line">
          <iframe
            title={`${companyName} location`}
            src={mapSrc}
            className="block h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
