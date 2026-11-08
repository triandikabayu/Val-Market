export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-xl uppercase tracking-wide text-ink ${className}`}
    >
      val<span className="text-accent">{"//"}</span>market
    </span>
  );
}
