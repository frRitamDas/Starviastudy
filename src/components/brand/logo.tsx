import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Starvia wordmark. Uses the supplied transparent PNG assets.
 * `mark` renders just the symbol, `full` renders the symbol plus the wordmark.
 */
export function Logo({
  variant = "full",
  className,
  href = "/",
  priority = false,
}: {
  variant?: "mark" | "full";
  className?: string;
  href?: string | null;
  priority?: boolean;
}) {
  const content = (
    <span className={cn("inline-flex items-center", className)}>
      {variant === "mark" ? (
        <Image
          src={siteConfig.logoMark}
          alt="Starvia"
          width={32}
          height={32}
          priority={priority}
          className="h-7 w-7 object-contain"
        />
      ) : (
        <Image
          src={siteConfig.logoFull}
          alt="Starvia"
          width={132}
          height={34}
          priority={priority}
          className="h-7 w-auto object-contain dark:invert"
        />
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={`${siteConfig.name} home`} className="inline-flex items-center">
      {content}
    </Link>
  );
}
