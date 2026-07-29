interface CategoryDotProps {
  color: string;
  label?: string;
}

export function CategoryDot({ color, label }: CategoryDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}
