
type NavbarProps = {
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
};

export default function Navbar({ selectedTab, setSelectedTab }: NavbarProps) {
    return (
        <div className="py-6 bg-primary min-w-80 text-white">
            <h1 className="px-6 pb-6 font-bold">
                QUẢN LÝ PHÒNG KHÁM
            </h1>
            <nav className="flex flex-col text-white gap-4">
                <button
                    onClick={() => setSelectedTab("dashboard")}
                    className={"bg-primary px-6 py-3 text-left " + (selectedTab === "dashboard" ? "bg-primary-dark" : "")}
                >
                    Dashboard
                </button>

                <button
                    onClick={() => setSelectedTab("slots")}
                    className={"bg-primary px-6 py-3 text-left " + (selectedTab === "slots" ? "bg-primary-dark" : "")}
                >
                    Lịch hẹn
                </button>

                <button
                    onClick={() => setSelectedTab("patients")}
                    className={"bg-primary px-6 py-3 text-left " + (selectedTab === "patients" ? "bg-primary-dark" : "")}
                >
                    Bệnh nhân
                </button>
            </nav>
        </div>
    )
}