import Link from "next/link";
import { Instagram, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { footerNav, siteConfig } from "@/lib/site";

/** Public site footer. Carries the founder credit and legal links. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground text-pretty">
              {siteConfig.shortDescription}
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.supportEmail}
              </a>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
                {siteConfig.instagram}
              </a>
            </div>
          </div>

          <FooterColumn title="Product" links={footerNav.product} />
          <FooterColumn title="Learn" links={footerNav.learn} />
          <FooterColumn title="Company" links={footerNav.company} />
          <FooterColumn title="Legal" links={footerNav.legal} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-pretty">
            Founded by <span className="font-medium text-foreground">{siteConfig.founder}</span>
            {" · "}
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {siteConfig.instagram}
            </a>
            {" · "}
            <span>Version {siteConfig.version}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { title: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
