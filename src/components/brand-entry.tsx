import Link from 'next/link';
import Image from 'next/image';
import { BRANDS } from '@/lib/brand-catalog';
export function BrandEntry({
  brand,
  compact = false,
  selected = false,
}: {
  brand: (typeof BRANDS)[number];
  compact?: boolean;
  selected?: boolean;
}) {
  return (
    <Link
      href={`/brands?brand=${brand.id}`}
      className={`brand-entry ${compact ? 'compact' : ''} ${selected ? 'selected' : ''}`}
      aria-current={selected ? 'page' : undefined}
    >
      <div className={`brand-logo-well brand-${brand.id}`}>
        <Image src={brand.logo} alt={`${brand.name} Logo`} width={160} height={58} unoptimized />
      </div>
      {!compact && (
        <div className="brand-entry-caption">
          <div>
            <h3>{brand.name}</h3>
            <p>{brand.description}</p>
            <small className="brand-entry-total">已收录 {brand.total.toLocaleString()} 部</small>
          </div>
          <span aria-hidden="true">↗</span>
        </div>
      )}
      {compact && <span className="brand-compact-name">{brand.name}</span>}
    </Link>
  );
}
