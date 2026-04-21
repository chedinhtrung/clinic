"use client";

import { useState } from "react";

type NavbarProps = {
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
};

const navItems = [
    { id: "dashboard", label: "Dashboard", shortLabel: "D" },
    { id: "slots", label: "Lịch hẹn", shortLabel: "L" },
    { id: "patients", label: "Bệnh nhân", shortLabel: "B" },
    { id: "blogs", label: "Bài viết", shortLabel: "V" },
];

export default function Navbar({ selectedTab, setSelectedTab }: NavbarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={`relative shrink-0 bg-primary py-6 text-white transition-all duration-300 ${
                isCollapsed ? "w-20" : "w-80"
            }`}
        >
            <button
                type="button"
                onClick={() => setIsCollapsed((current) => !current)}
                className="absolute -right-4 top-6 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-primary-dark bg-white text-lg leading-none text-primary shadow-md transition hover:bg-primary-light"
                aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
                {isCollapsed ? ">" : "<"}
            </button>

            <div className="px-5 pb-6">
                <div className="flex h-10 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 font-bold">
                        Q
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-sm font-bold uppercase tracking-[0.12em]">
                            Quản lý phòng khám
                        </h1>
                    )}
                </div>
            </div>

            <nav className="flex flex-col gap-2 px-3 text-white">
                {navItems.map((item) => {
                    const isActive = selectedTab === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedTab(item.id)}
                            title={item.label}
                            className={`flex h-11 items-center rounded-xl px-3 text-left text-sm font-semibold transition ${
                                isActive
                                    ? "bg-primary-dark text-white shadow-inner"
                                    : "text-white/80 hover:bg-white/10 hover:text-white"
                            } ${isCollapsed ? "justify-center" : "justify-start"}`}
                        >
                            {isCollapsed ? item.shortLabel : item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
