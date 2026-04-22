import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border mt-auto mb-18 sm:mb-10 lg:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        {/* Flex column on mobile, row on larger screens */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">

          {/* Logo/Brand - Full width on mobile, auto on desktop */}
          <div className="w-full md:w-auto text-center md:text-left">
            <span
              className="text-secondary font-bold tracking-[0.12em] text-[15px] sm:text-[16px] md:text-[17px] uppercase
                  hover:opacity-80 transition-opacity duration-200 inline-block"
            >
              Explore with unity
            </span>
          </div>

          {/* Navigation Links - Wrap on mobile, row on desktop */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 px-2">
            <Link
              href="/about"
              className="text-[10px] sm:text-[11px] font-medium tracking-[0.08em] text-[#666] uppercase hover:text-secondary transition-colors duration-200 whitespace-nowrap"
            >
              ABOUT
            </Link>
            <Link
              href="/terms"
              className="text-[10px] sm:text-[11px] font-medium tracking-[0.08em] text-[#666] uppercase hover:text-secondary transition-colors duration-200 whitespace-nowrap"
            >
              TERMS
            </Link>
            <Link
              href="/privacy"
              className="text-[10px] sm:text-[11px] font-medium tracking-[0.08em] text-[#666] uppercase hover:text-secondary transition-colors duration-200 whitespace-nowrap"
            >
              PRIVACY
            </Link>
            <Link
              href="/help"
              className="text-[10px] sm:text-[11px] font-medium tracking-[0.08em] text-[#666] uppercase hover:text-secondary transition-colors duration-200 whitespace-nowrap"
            >
              HELP
            </Link>
          </div>

          {/* Copyright - Full width on mobile, auto on desktop */}
          <div className="w-full md:w-auto text-center md:text-right">
            <div className="text-[9px] sm:text-[10px] text-[#999] tracking-wide">
              © {currentYear} Explore with unity. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}