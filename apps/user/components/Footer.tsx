import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone } from "lucide-react";
import { ADMIN_LOGIN_URL, BRAND, PRODUCT_MENU, formatAddress } from "@/lib/site";
import { resolveSocials } from "@/components/SocialIcons";
import type { SiteSettings } from "@kr/shared/types";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Stations", href: "/stations" },
  { label: "Guide", href: "/guide" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
];

export function Footer({
  contact,
  site,
}: {
  contact: { essentials: any | null; presents: any | null };
  site: SiteSettings;
}) {
  const email = contact.essentials?.emails?.info || BRAND.email;
  const phone = contact.essentials?.phoneNos?.office || BRAND.phone;
  const address = formatAddress(contact.presents?.address);
  const tags = site.footerTags?.length ? site.footerTags : ["Auto LPG", "Conversion Kits", "LPG Stations", "FAQ"];
  // Official brand icons, canonical order, blank/placeholder admin values dropped.
  const socials = resolveSocials(site.social);

  return (
    <footer className="mt-0 bg-ink text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-10 w-12 place-items-center rounded-lg bg-white px-1">
              <Image src="/assets/logo.png" alt="KR Trans Fuels" width={44} height={35} className="h-[30px] w-auto" />
            </span>
            <span className="text-[15px] font-extrabold text-white">{BRAND.shortName}</span>
          </div>
          <p className="text-sm leading-relaxed">{BRAND.footerTagline}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-lime" />{address}</div>
            <Link href={`mailto:${email}`} className="flex items-center gap-2 hover:text-lime"><Mail size={15} className="text-lime" />{email}</Link>
            <Link href={`tel:${phone}`} className="flex items-center gap-2 hover:text-lime"><Phone size={15} className="text-lime" />{phone}</Link>
          </div>
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {socials.map(({ key, label, url, color, Icon }) => (
                <Link
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  style={{ ["--brand-social" as string]: color }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-(--brand-social)"
                >
                  <Icon size={17} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold tracking-wider text-white">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-lime">{l.label}</Link></li>
            ))}
            {/* <li><Link href={ADMIN_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="hover:text-lime">Staff Login</Link></li> */}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold tracking-wider text-white">Products</h4>
          <ul className="space-y-2.5 text-sm">
            {PRODUCT_MENU.map((p) => (
              <li key={p.label}>
                {p.external ? (
                  <Link href={p.href} target="_blank" rel="noopener noreferrer" className="hover:text-lime">{p.label} ↗</Link>
                ) : (
                  <Link href={p.href} className="hover:text-lime">{p.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold tracking-wider text-white">Explore</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <span>© {new Date().getFullYear()} {BRAND.name}. All Rights Reserved.</span>
          <span>{BRAND.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
