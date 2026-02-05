import Link from "next/link";

export interface LogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
}

/**
 * DoNext Logo component with DN monogram.
 *
 * Features:
 * - Gradient background (indigo to purple)
 * - Configurable size
 * - Optional "DoNext" text
 * - Optional link wrapper
 *
 * @example
 * <Logo size={40} />
 * <Logo size={64} showText />
 * <Logo size={48} href="/" showText />
 */
export function Logo({ size = 40, showText = false, href }: LogoProps) {
  const logoContent = (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg"
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>DN</span>
      </div>
      {showText && (
        <span className="text-xl font-bold text-gray-900">DoNext</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
