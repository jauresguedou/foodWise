
import Link from 'next/link';

const adminLinks = [
  { label: 'Dashboard', href: '/admin' },
  {
    label: 'Vendor Applications',
    href: '/admin/vendor-applications',
  },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <nav
        aria-label="Admin navigation"
        className="border-b border-[#123C32] bg-[#123C32]"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="mr-3 font-bold text-white transition hover:text-[#F6B94A]"
          >
            FoodWise Admin
          </Link>

          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#F6B94A] hover:bg-[#F6B94A] hover:text-[#123C32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6B94A]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {children}
    </div>
  );
}
