import type { HubLink } from '../types';

interface SidebarProps {
  bio: string;
  hubLinks: HubLink[];
}

export function Sidebar({ bio, hubLinks }: SidebarProps) {
  return (
    <aside className="flex flex-col gap-4 border-b-2 border-ink bg-cream p-4 sm:w-64 sm:border-b-0 sm:border-r-2">
      <div>
        <h1 className="font-display text-xl text-ink">Jake</h1>
        <p className="mt-1 text-sm text-stone-600">{bio}</p>
      </div>
      <nav className="flex flex-col gap-2">
        {hubLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border-2 border-ink bg-white px-3 py-1.5 text-center text-sm font-semibold text-ink"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
