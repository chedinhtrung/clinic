import Link from "next/link";

export default function Intro() {
    return (
        <div className="sm:px-20 px-6 pb-10 bg-gradient-to-br from-navy-dark to-navy-mid p-6 text-white flex justify-center">
            <div className="flex w-full max-w-7xl flex-col gap-8 xl:flex-row xl:gap-10">
                <div className="max-w-200">

                    {/* Avatar */}
                    <div className="py-6 flex gap-6">
                        <div className="bg-[position:center_40%] bg-[url('/images/bsnghia.jpeg')] bg-cover h-40 w-40 
                    rounded-full border-4 border-bg-light shadow-xl">
                        </div>
                        <div className="h-[100%] flex flex-col py-auto">
                            <div className="inline-flex items-center gap-2 rounded-md border border-[#C9952E]/50 bg-gold/20 px-4 py-2">
                                <span className="text-gold text-sm font-semibold tracking-widest uppercase text-[0.5rem] sm:text-[0.8rem]">
                                    ⭐ Chuyên gia hàng đầu Việt Nam
                                </span>
                            </div>
                            <h1 className="font-serif text-lg sm:text-3xl font-bold py-2">TS.BS. Chế Đình Nghĩa</h1>
                            <p className="text-gold font-bold">Tiến sĩ · Bác sĩ Chuyên khoa Chấn thương Chỉnh hình</p>
                        </div>
                    </div>

                    {/* Intro text */}
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-20">
                        <div className="text-gray-400 leading-loose ">

                            <p className="mb-4">
                                Hơn 25 năm kinh nghiệm, 20 năm công tác trong lĩnh vực chấn thương chỉnh hình tại Bệnh viện TW Quân Đội 108 với trên 10.000 ca phẫu thuật thành công. Chuyên gia về nội soi khớp, thay khớp ít xâm lấn và chấn thương thể thao tại Hà Nội.
                            </p>
                        </div>

                    </div>

                    {/* highlights */}

                    <div className="py-10">
                        <div className="max-w-5xl mx-auto flex justify-between items-center text-center">

                            {/* Item 1 */}
                            <div className="flex-1">
                                <p className="text-gold text-4xl font-bold">25+</p>
                                <p className="mt-2 text-sm text-white/80 tracking-widest uppercase">
                                    Năm kinh nghiệm
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-16 bg-white/20"></div>

                            {/* Item 2 */}
                            <div className="flex-1">
                                <p className="text-gold text-4xl font-bold">10.000+</p>
                                <p className="mt-2 text-sm text-white/80 tracking-widest uppercase">
                                    Ca phẫu thuật
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-16 bg-white/20"></div>

                            {/* Item 3 */}
                            <div className="flex-1">
                                <p className="text-gold text-4xl font-bold">30+</p>
                                <p className="mt-2 text-sm text-white/80 tracking-widest uppercase">
                                    Công trình KH
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="flex gap-4">

                        <a href="#booking" className="flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-white font-semibold hover:bg-gold-light transition">
                            <span>📅</span>
                            ĐẶT LỊCH KHÁM NGAY
                        </a>

                        <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3 text-white font-semibold hover:bg-white/10 transition"
                        >
                            TÌM HIỂU THÊM →
                        </Link>
                    </div>

                </div>

                <div className="w-full rounded-lg bg-navy-light px-4 py-4 text-white shadow-xl sm:px-6 sm:py-5 xl:ml-auto xl:max-w-md xl:rounded-xl xl:px-8 xl:py-6">
                    <h2 className="text-gold text-xs font-semibold uppercase tracking-[0.2em] sm:text-sm sm:tracking-[0.25em] xl:mt-8">
                        Chuyên khoa điều trị
                    </h2>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:mt-4 xl:block xl:divide-y xl:divide-white/10">

                        <div className="cursor-pointer rounded-md border border-white/10 bg-white/5 p-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-6">
                            <div className="flex items-center gap-3 transition-all duration-300 group hover:translate-x-2 xl:gap-5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 text-sm group-hover:bg-gold/15 xl:h-12 xl:w-12 xl:text-base">
                                    💉
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold xl:text-base">Điều trị PRP &amp; Tế bào gốc</h3>
                                    <p className="mt-1 hidden text-white/65 xl:block">Sinh học tái tạo sụn khớp</p>
                                </div>
                            </div>
                        </div>

                        <div className="cursor-pointer rounded-md border border-white/10 bg-white/5 p-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-6">
                            <div className="flex items-center gap-3 transition-all duration-300 group hover:translate-x-2 xl:gap-5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 text-sm group-hover:bg-gold/15 xl:h-12 xl:w-12 xl:text-base">
                                    ⚙️
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold xl:text-base">Thay khớp ít xâm lấn</h3>
                                    <p className="mt-1 hidden text-white/65 xl:block">Khớp gối, khớp háng nhân tạo</p>
                                </div>
                            </div>
                        </div>

                        <div className="cursor-pointer rounded-md border border-white/10 bg-white/5 p-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-6">
                            <div className="flex items-center gap-3 transition-all duration-300 group hover:translate-x-2 xl:gap-5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 text-sm group-hover:bg-gold/15 xl:h-12 xl:w-12 xl:text-base">
                                    🦴
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold xl:text-base">Gãy xương &amp; Biến dạng chi thể</h3>
                                    <p className="mt-1 hidden text-white/65 xl:block">Đa chấn thương, gãy xương phức tạp</p>
                                </div>
                            </div>
                        </div>

                        <div className="cursor-pointer rounded-md border border-white/10 bg-white/5 p-3 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-6">
                            <div className="flex items-center gap-3 transition-all duration-300 group hover:translate-x-2 xl:gap-5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 text-sm group-hover:bg-gold/15 xl:h-12 xl:w-12 xl:text-base">
                                    ⚽
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold xl:text-base">Chấn thương Thể thao</h3>
                                    <p className="mt-1 hidden text-white/65 xl:block">Chấn thương thường gặp trong thể thao</p>
                                </div>
                            </div>
                        </div>

                        
                    </div>
                </div>
            </div>
        </div>
    )
}
