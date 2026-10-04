import type { Metadata } from "next";
import { Instagram, Mail, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { ContactForm } from "@/components/marketing/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Starvia for support, feedback, bug reports or partnership enquiries. We reply to every student message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-border bg-grid">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Contact"
              title="Talk to the person who built it"
              description="Starvia is a small, independent product. Your message goes directly to the founder, not a support queue."
            />
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">Email</h3>
                  <a
                    href={`mailto:${siteConfig.supportEmail}`}
                    className="mt-1 block text-sm text-muted-foreground underline underline-offset-4"
                  >
                    {siteConfig.supportEmail}
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">Instagram</h3>
                  <a
                    href={siteConfig.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-muted-foreground underline underline-offset-4"
                  >
                    {siteConfig.instagram}
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">Response time</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Usually within 1–2 working days.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">What to include</h3>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    For a bug, mention your class, subject and what you were doing. For a wrong
                    answer, paste the question so we can look at it.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
