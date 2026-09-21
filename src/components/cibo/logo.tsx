"use client";

import { cn } from "@/lib/utils";

export function CiboLogo({
  className,
  showWordmark = true,
  size = 40,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/cibo-logo.svg"
        alt="CIBO logo"
        width={size}
        height={size}
        className="rounded-2xl shrink-0"
        style={{ aspectRatio: "1 / 1" }}
      />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-display font-bold tracking-[0.18em] text-forest"
            style={{ fontSize: size * 0.5 }}
          >
            CIBO
          </span>
          <span
            className="text-gold font-semibold tracking-[0.22em] uppercase"
            style={{ fontSize: size * 0.16, marginTop: 2 }}
          >
            Good Food · Brighter Tomorrow
          </span>
        </div>
      )}
    </div>
  );
}

export function CiboMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src="/cibo-logo.svg"
      alt="CIBO"
      width={size}
      height={size}
      className={cn("rounded-2xl shrink-0", className)}
      style={{ aspectRatio: "1 / 1" }}
    />
  );
}
