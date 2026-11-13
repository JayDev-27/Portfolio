import { Scramble } from "./ui/motion";

export function Section({
  id,
  index,
  title,
  kicker,
  children,
  className = "",
}: {
  id?: string;
  index?: string;
  title?: string;
  kicker?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`rail tick mx-auto max-w-3xl border-t border-line ${className}`}>
      {title && (
        <div className="flex items-end justify-between gap-4 px-4 pb-5 pt-10 sm:px-6">
          <div>
            {index && <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">{index}</div>}
            <Scramble as="h2" text={title} className="font-pixel text-2xl tracking-tight sm:text-3xl" />
          </div>
          {kicker && <p className="hidden max-w-[16rem] text-right text-xs leading-relaxed text-muted sm:block">{kicker}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10.5px] tracking-wide ${
        accent ? "border-accent/40 bg-accent/10 text-accent" : "border-line bg-bg-2 text-muted"
      }`}
    >
      {children}
    </span>
  );
}
