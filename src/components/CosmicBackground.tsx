export function CosmicBackground() {
  return (
    <div
      data-testid="cosmic-background"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
      aria-hidden="true"
    >
      <div data-testid="cosmic-starfield" className="cosmic-starfield" />
      <div data-testid="cosmic-sun" className="cosmic-sun" />
    </div>
  );
}
