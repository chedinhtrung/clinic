export default function Intro() {
    return (
        <div className="sm:px-20 px-6 pb-10 bg-gradient-to-br from-navy-dark to-navy-mid p-6 text-white flex justify-center">
            <div className="flex max-w-7xl gap-10">
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
                                Hơn 25 năm kinh nghiệm, 20 năm công tác trong lĩnh vực chấn thương chỉnh hình tại Bệnh viện TW Quân Đội 108 với trên 10.000 ca phẫu thuật thành công. Chuyên gia về nội soi khớp, thay khớp ít xâm lấn và Y học Thể thao tại Hà Nội.
                            </p>
                        </div>

                    </div>

                    <div className="flex gap-4">

                        <button className="flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-white font-semibold hover:bg-gold-light transition">
                            <span>📅</span>
                            ĐẶT LỊCH KHÁM NGAY
                        </button>

                        <button className="flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3 text-white font-semibold hover:bg-white/10 transition">
                            TÌM HIỂU THÊM →
                        </button>
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

                </div>

                <div className="rounded-xl bg-navy-light py-6 px-8 text-white ml-auto hidden xl:block">
                    <h2 className="text-gold text-sm font-semibold uppercase tracking-[0.25em] mt-8">
                        Chuyên khoa điều trị
                    </h2>

                    <div className="mt-4 divide-y divide-white/10">
                        <div className="py-6 cursor-pointer">
                            <div className="flex items-center gap-5 transition-all duration-300 group hover:translate-x-2">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 group-hover:bg-gold/15">
                                    🦴
                                </div>
                                <div>
                                    <h3 className=" font-bold">Gãy xương &amp; Chấn thương</h3>
                                    <p className="mt-1  text-white/65">Đa chấn thương, gãy xương phức tạp</p>
                                </div>
                            </div>
                        </div>

                        <div className="py-6 cursor-pointer ">
                            <div className="flex items-center gap-5 transition-all duration-300 group hover:translate-x-2">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 group-hover:bg-gold/15">
                                    🔗
                                </div>
                                <div>
                                    <h3 className=" font-bold">Tổn thương dây chằng</h3>
                                    <p className="mt-1  text-white/65">ACL, PCL, MCL, sụn chêm</p>
                                </div>
                            </div>
                        </div>

                        <div className="py-6 cursor-pointer">
                            <div className="flex items-center gap-5 transition-all duration-300 group hover:translate-x-2">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 group-hover:bg-gold/15">
                                    ⚙️
                                </div>
                                <div>
                                    <h3 className=" font-bold">Thay khớp ít xâm lấn</h3>
                                    <p className="mt-1  text-white/65">Khớp gối, khớp háng nhân tạo</p>
                                </div>
                            </div>
                        </div>

                        <div className="py-6 cursor-pointer">
                            <div className="flex items-center gap-5 transition-all duration-300 group hover:translate-x-2">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 group-hover:bg-gold/15">
                                    ⚽
                                </div>
                                <div>
                                    <h3 className=" font-bold">Y học Thể thao</h3>
                                    <p className="mt-1  text-white/65">Chấn thương vận động viên</p>
                                </div>
                            </div>
                        </div>

                        <div className="py-6 cursor-pointer">
                            <div className="flex items-center gap-5 transition-all duration-300 group hover:translate-x-2">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/5 group-hover:bg-gold/15">
                                    💉
                                </div>
                                <div>
                                    <h3 className=" font-bold">Điều trị PRP &amp; Tế bào gốc</h3>
                                    <p className="mt-1  text-white/65">Sinh học tái tạo sụn khớp</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}