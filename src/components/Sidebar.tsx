import type { HubLink } from '../types';

interface SidebarProps {
  bio: string;
  hubLinks: HubLink[];
}

export function Sidebar({ bio, hubLinks }: SidebarProps) {
  return (
    <aside className="flex flex-col gap-4 border-b border-hairline p-4 sm:w-64 sm:border-b-0 sm:border-r">
      <div>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">Jake</h1>
        <p className="mt-1 text-sm text-muted">{bio}</p>
      </div>
      <nav className="flex flex-col gap-2">
        {hubLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-faint transition-colors hover:text-ember"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
