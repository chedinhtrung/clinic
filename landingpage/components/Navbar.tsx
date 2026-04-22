import { useState } from "react";
import Link from "next/link";

const menuItems = [
    { id: "home", label: "TRANG CHỦ", href: "/" },
    { id: "intro", label: "GIỚI THIỆU" },
    { id: "injuries", label: "CHẤN THƯƠNG" },
    { id: "methods", label: "PHẪU THUẬT" },
    { id: "blog", label: "BÀI VIẾT" },
    { id: "contact", label: "LIÊN HỆ" },
];

export default function Navbar(
    { selectedPage, setSelectedPage }
        : { selectedPage: string, setSelectedPage: (page: string) => void }
) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const selectPage = (page: string) => {
        setSelectedPage(page);
        setIsMenuOpen(false);
    };

    const desktopLinkClass = (page: string) => [
        "flex h-full items-center border-b-4 text-center transition-colors cursor-pointer",
        selectedPage === page
            ? "border-b-gold text-gold"
            : "border-b-transparent text-white hover:border-b-gold hover:text-gold",
    ].join(" ");

    const mobileLinkClass = (page: string) => [
        "flex w-full items-center border-l-4 px-5 py-4 text-sm font-bold transition-colors",
        selectedPage === page
            ? "border-l-gold bg-white/10 text-gold"
            : "border-l-transparent text-white hover:border-l-gold hover:bg-white/10 hover:text-gold",
    ].join(" ");

    return (
        <nav className="sticky top-0 z-10 bg-navy-mid px-4 py-2 text-white leading-relaxed sm:px-8">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-1 rounded-full bg-gold aspect-square items-center hidden sm:flex">
                        CĐN
                    </div>
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
                        <a
                            key={item.id}
                            href={item.href}
                            className={desktopLinkClass(item.id)}
                            onClick={() => { selectPage(item.id) }}
                        >
                            {item.label}
                        </a>
                    ))}
                </ul>

                <div className="ml-auto hidden h-full items-center justify-center gap-2 font-bold uppercase sm:flex">
                    <a className="bg-gold hover:bg-gold-light flex justify-center items-center rounded-sm p-2 flex-shrink-0">
                        Đặt lịch khám →
                    </a>
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
                    <span className="font-bold font-serif text-sm">TS.BS. Chế Đình Nghĩa</span>
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
                        <a
                            key={item.id}
                            href={item.href}
                            className={mobileLinkClass(item.id)}
                            onClick={() => { selectPage(item.id) }}
                        >
                            {item.label}
                        </a>
                    ))}
                </ul>
                <div className="px-5 py-3 sm:hidden">
                    <a className="bg-gold hover:bg-gold-light flex justify-center items-center rounded-sm p-2 font-bold uppercase">
                        Đặt lịch khám →
                    </a>
                </div>
            </div>
        </nav>
    )
}
