

export default function Navbar(
    { selectedPage, setSelectedPage }
        : { selectedPage: string, setSelectedPage: (page: string) => void }
) {
    return (
        <nav className="h-20 items-center px-8 bg-navy-mid flex gap-4 text-white leading-relaxed sticky top-0 z-10">
            <div className="flex items-center gap-4">
            <div className="p-1 rounded-full bg-gold aspect-square items-center hidden sm:flex">
                CĐN
            </div>
            <a
                href="/"
                className="tracking-normal leading-relaxed text-white"
                style={{ fontKerning: "auto" }}
            >
                <span className="font-bold">TS.BS. Chế Đình Nghĩa</span>
                <br />
                <span className="font-sans text-xs text-gold tracking-normal uppercase">
                    Chấn Thương Chỉnh Hình · Hà Nội
                </span>
            </a>
            </div>
            <ul className="flex h-[100%] gap-8 justify-center items-center flex-1 text-sm font-bold hidden lg:flex">
                <a href="/" className="hover:text-gold flex h-[100%] text-center items-center hover:border-b-4 border-navy-mid hover:border-b-gold border-b-2"
                onClick={() => {setSelectedPage("home")}}>
                    TRANG CHỦ
                </a>
                <a href="#" className=" hover:text-gold flex h-[100%] text-center items-center hover:border-b-4 border-navy-mid hover:border-b-gold border-b-2"
                onClick={() => {setSelectedPage("intro")}}>
                    GIỚI THIỆU
                </a>
                <a href="#" className="hover:text-gold flex h-[100%] text-center items-center hover:border-b-4 border-navy-mid hover:border-b-gold border-b-2"
                onClick={() => {setSelectedPage("injuries")}}>
                    CHẤN THƯƠNG
                </a>
                <a href="#" className="hover:text-gold flex h-[100%] text-center items-center hover:border-b-4 border-navy-mid hover:border-b-gold border-b-2"
                onClick={() => {setSelectedPage("methods")}}>
                    PHẪU THUẬT
                </a>
                <a href="#" className="hover:text-gold flex h-[100%] text-center items-center hover:border-b-4 border-navy-mid hover:border-b-gold border-b-2"
                onClick={() => {setSelectedPage("blog")}}>
                    BÀI VIẾT
                </a>
                <a href="#" className="hover:text-gold flex h-[100%] text-center items-center hover:border-b-4 border-navy-mid hover:border-b-gold border-b-2"
                onClick={() => {setSelectedPage("contact")}}>
                    LIÊN HỆ
                </a>
            </ul>
            <div className="flex gap-2 justify-center items-center ml-auto  h-full font-bold uppercase">
                <a href="#" className="bg-gold hover:bg-gold-light flex justify-center items-center rounded-sm p-2 flex-shrink-0">
                    Đặt lịch khám →
                </a>
            </div>
        </nav>
    )
}