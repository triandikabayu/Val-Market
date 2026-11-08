export function DisclaimerFooter() {
  return (
    <footer className="mx-auto w-full max-w-[65ch] px-4 pb-8 text-center">
      <p className="text-xs leading-relaxed text-ink-muted">
        Unofficial fan tool. Not affiliated with or endorsed by Riot Games.
        Valorant and all related properties are trademarks of Riot Games, Inc.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        Store data is fetched once per session when you sign in — no
        automation, no background polling.
      </p>
    </footer>
  );
}
