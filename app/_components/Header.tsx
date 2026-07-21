import Image from "next/image";

/**
 * BRH brand header — wordmark + title + "En ligne" status pill.
 */
export function Header() {
  return (
    <header className="border-b border-primary/80 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
        <Image
          alt="Banque de la République d'Haïti"
          className="h-9 w-auto"
          height={36}
          priority
          src="/brh-logo-light.png"
          width={73}
        />
        <div className="hidden h-9 w-px bg-primary-foreground/20 sm:block" />
        <div className="flex-1 leading-tight">
          <p className="font-heading font-semibold text-base tracking-tight">
            Assistant RDDCF
          </p>
          <p className="text-primary-foreground/70 text-xs">
            Banque de la République d&apos;Haïti
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 animate-pulse rounded-full bg-accent"
          />
          <span className="font-medium text-primary-foreground/80 text-xs uppercase tracking-wider">
            En ligne
          </span>
        </div>
      </div>
    </header>
  );
}
