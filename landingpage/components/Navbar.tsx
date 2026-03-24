

export default function Navbar(){
    return (
        <nav className="h-15 items-center px-8 bg-bg-tinted flex gap-4">
            <a href="#" className="text-txt-primary text-xs font-bold">TS.BS Chế Đình Nghĩa</a>
            <ul className="flex gap-4 justify-center items-center flex-1 text-xs font-bold hidden sm:flex">
                <li>
                    <a href="#" className="text-txt-gray">Bác sỹ</a>
                </li>
                <li>
                    <a href="#" className="text-txt-gray">Quy trình</a>
                </li>
                <li>
                    <a href="#" className="text-txt-gray">Bảng giá</a>
                </li>
                <li>
                    <a href="#" className="text-txt-gray">Theo dõi</a>
                </li>
            </ul>
            <ul className="flex gap-2 justify-center items-center ml-auto text-[0.5rem] h-full font-bold">
                <li className="bg-bg-light h-1/2 aspect-square flex justify-center items-center rounded-sm border border-light-gray">
                    <a href="#" className="text-txt-gray p-1">▶</a>
                </li>
                <li className="bg-bg-light h-1/2 aspect-square flex justify-center items-center rounded-sm border border-light-gray">
                    <a href="#" className="text-txt-gray p-1">♪</a>
                </li>
                <li className="bg-bg-light h-1/2 aspect-square flex justify-center items-center rounded-sm border border-light-gray">
                    <a href="#" className="text-txt-gray p-1">f</a>
                </li>
                <li className="bg-primary text-txt-light flex justify-center items-center rounded-sm p-2 text-[0.6rem] flex-shrink-0">
                    <a href="#dat-lich" className="nav-cta">Đặt lịch →</a>
                </li>
            </ul>
        </nav>
    )
}