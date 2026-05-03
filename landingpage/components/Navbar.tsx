"use client"

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
    { id: "home", label: "TRANG CHỦ", href: "/" },
    { id: "profile", label: "GIỚI THIỆU", href: "/profile" },
    //{ id: "injuries", label: "CHẤN THƯƠNG", href: "/injuries" },
    { id: "blog", label: "BÀI VIẾT", href: "/blog" },
    { id: "contact", label: "LIÊN HỆ", href: "/contact" },
];

const socialLinks = [
    {
        label: "Facebook",
        href: "https://web.facebook.com/BSNghiachuyenxuongkhop",
        icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M14 8.5V6.75c0-.58.39-.75.67-.75H16V3.8c-.23-.03-1.02-.1-1.94-.1-1.92 0-3.23 1.17-3.23 3.32V8.5H8.75V11h2.08v7.2H13.4V11h2.13l.34-2.5H14Z" />
            </svg>
        ),
    },
    {
        label: "YouTube",
        href: "https://www.youtube.com/@nghiachedinh",
        icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M20.15 7.2a2.5 2.5 0 0 0-1.76-1.77C16.84 5 12 5 12 5s-4.84 0-6.39.43A2.5 2.5 0 0 0 3.85 7.2 26 26 0 0 0 3.43 12a26 26 0 0 0 .42 4.8 2.5 2.5 0 0 0 1.76 1.77C7.16 19 12 19 12 19s4.84 0 6.39-.43a2.5 2.5 0 0 0 1.76-1.77 26 26 0 0 0 .42-4.8 26 26 0 0 0-.42-4.8ZM10.3 15V9l5.2 3-5.2 3Z" />
            </svg>
        ),
    },
    {
        label: "TikTok",
        href: "https://www.tiktok.com/@tsnghia_xuongkhop",
        icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                <path d="M15.2 3.5c.28 2.04 1.42 3.25 3.3 3.38v2.5a6.32 6.32 0 0 1-3.3-1.02v5.98c0 3.02-2.04 5.16-5.08 5.16-2.75 0-4.62-1.72-4.62-4.22 0-2.65 2.03-4.52 4.9-4.52.32 0 .62.03.9.1v2.63a3.4 3.4 0 0 0-.92-.13c-1.32 0-2.17.73-2.17 1.82 0 1 .76 1.7 1.83 1.7 1.36 0 2.17-.82 2.17-2.55V3.5h2.99Z" />
            </svg>
        ),
    },
];

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const isActive = (page: string) =>
        (page === "home" && pathname === "/") ||
        (page === "profile" && pathname === "/profile") ||
        (page === "injuries" && pathname === "/injuries") ||
        (page === "blog" && pathname.startsWith("/blog")) ||
        (page === "contact" && pathname === "/contact");

    const desktopLinkClass = (page: string) => [
        "flex h-full items-center border-b-4 text-center transition-colors cursor-pointer",
        isActive(page)
            ? "border-b-gold text-gold"
            : "border-b-transparent text-white hover:border-b-gold hover:text-gold",
    ].join(" ");

    const mobileLinkClass = (page: string) => [
        "flex w-full items-center border-l-4 px-5 py-4 text-sm font-bold transition-colors",
        isActive(page)
            ? "border-l-gold bg-white/10 text-gold"
            : "border-l-transparent text-white hover:border-l-gold hover:bg-white/10 hover:text-gold",
    ].join(" ");

    return (
        <nav className="sticky top-0 z-10 bg-navy-mid px-4 py-2 text-white leading-relaxed sm:px-8">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    <Image
                        src="/images/logo.svg"
                        alt="TS.BS. Chế Đình Nghĩa"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover sm:block"
                        priority
                    />
                    <Link
                        href="/"
                        className="tracking-normal leading-relaxed text-white"
                        style={{ fontKerning: "auto" }}
                    >
                        <span className="font-bold font-serif sm:text-md text-sm">TS.BS. Chế Đình Nghĩa</span>
                        <br />
                        <span className="font-sans text-xs text-gold tracking-normal uppercase sm:text-sm">
                            Chấn Thương Chỉnh Hình · Hà Nội
                        </span>
                    </Link>
                </div>

                <ul className="hidden h-12 flex-1 items-center justify-center gap-8 text-sm font-bold lg:flex">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={desktopLinkClass(item.id)}
                            onClick={closeMenu}
                        >
                            {item.label}
                        </Link>
                    ))}
                </ul>

                <div className="ml-auto hidden h-full items-center justify-center gap-2 sm:flex">
                    <div className="flex items-center gap-1.5" aria-label="Social media links">
                        {socialLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target={link.href.startsWith("http") ? "_blank" : undefined}
                                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                                aria-label={link.label}
                                title={link.label}
                                className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/25 text-sm font-black text-white transition-colors hover:border-gold hover:text-gold"
                            >
                                <span aria-hidden="true">{link.icon}</span>
                            </a>
                        ))}
                    </div>
                    <Link
                        href="/#booking"
                        className="bg-gold hover:bg-gold-light flex justify-center items-center rounded-sm p-2 flex-shrink-0 font-bold uppercase"
                        onClick={closeMenu}
                    >
                        Đặt lịch khám →
                    </Link>
                </div>

                <button
                    type="button"
                    className="ml-auto flex h-10 w-10 items-center justify-center rounded-sm border border-white/30 text-white transition-colors hover:border-gold hover:text-gold lg:hidden"
                    aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    <span className="sr-only">Toggle navigation</span>
                    <span className="relative block h-4 w-5">
                        <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                        <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity ${isMenuOpen ? "opacity-0" : "opacity-100"}`} />
                        <span className={`absolute bottom-0 left-0 h-0.5 w-5 bg-current transition-transform ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
                    </span>
                </button>
            </div>

            <div
                className={`fixed inset-0 z-20 bg-black/40 transition-opacity lg:hidden ${isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
                aria-hidden={!isMenuOpen}
                onClick={() => setIsMenuOpen(false)}
            />
            <div
                className={`fixed right-0 top-0 z-30 h-dvh w-72 max-w-[85vw] bg-navy-mid shadow-2xl transition-transform duration-300 lg:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex h-16 items-center justify-between border-b border-white/15 px-5">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/images/logo.svg"
                            alt="TS.BS. Chế Đình Nghĩa"
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                        <span className="font-bold font-serif text-sm">TS.BS. Chế Đình Nghĩa</span>
                    </div>
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/30 text-white transition-colors hover:border-gold hover:text-gold"
                        aria-label="Close navigation menu"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <span aria-hidden="true" className="text-2xl leading-none">&times;</span>
                    </button>
                </div>
                <ul className="py-3">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={mobileLinkClass(item.id)}
                            onClick={closeMenu}
                        >
                            {item.label}
                        </Link>
                    ))}
                </ul>
                <div className="flex items-center gap-2 border-t border-white/15 px-5 py-4" aria-label="Social media links">
                    {socialLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                            aria-label={link.label}
                            title={link.label}
                            className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/25 text-sm font-black text-white transition-colors hover:border-gold hover:text-gold"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span aria-hidden="true">{link.icon}</span>
                        </a>
                    ))}
                </div>
                <div className="px-5 py-3 sm:hidden">
                    <Link
                        href="/#booking"
                        className="bg-gold hover:bg-gold-light flex w-full justify-center items-center rounded-sm p-2 font-bold uppercase"
                        onClick={closeMenu}
                    >
                        Đặt lịch khám →
                    </Link>
                </div>
            </div>
        </nav>
    )
}
