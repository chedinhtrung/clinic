

export default function Navbar(){
    return (
        <nav className="h-20 items-center px-8 bg-bg-tinted flex gap-4">
            <a href="#" className="text-txt-primary  font-bold">TS.BS Chế Đình Nghĩa</a>
            <ul className="flex gap-4 justify-center items-center flex-1  font-bold hidden sm:flex">
                <li>
                    <a href="#" className="text-txt-gray hover:text-primary">Bác sỹ</a>
                </li>
                <li>
                    <a href="#" className="text-txt-gray hover:text-primary">Quy trình</a>
                </li>
                <li>
                    <a href="#" className="text-txt-gray hover:text-primary">Bảng giá</a>
                </li>
                <li>
                    <a href="#" className="text-txt-gray hover:text-primary">Theo dõi</a>
                </li>
            </ul>
            <div className="flex gap-2 justify-center items-center ml-auto  h-full font-bold">
                <a href="#" className="bg-bg-light h-1/2 aspect-square flex justify-center items-center rounded-sm border border-light-gray hover:border-primary hover:text-primary"
                title="YouTube">
                ▶
                </a>
                <a href="#" className="bg-bg-light h-1/2 aspect-square flex justify-center items-center rounded-sm border border-light-gray hover:border-primary hover:text-primary"
                title="TikTok">
                ♪
                </a>
                <a href="#" className="bg-bg-light h-1/2 aspect-square flex justify-center items-center rounded-sm border border-light-gray hover:border-primary hover:text-primary"
                title="Facebook">
                f
                </a>
                
                <a href= "#" className="bg-primary hover:bg-primary-dark text-txt-light flex justify-center items-center rounded-sm p-2 flex-shrink-0">
                Đặt lịch →
                </a>
                
            </div>
        </nav>
    )
}