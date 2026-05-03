

export default function Footer() {
    return (
        <div className="bg-navy-dark p-8 sm:px-20 flex justify-center">
            <div className="max-w-7xl w-full">
                <div className="flex flex-wrap sm:gap-30 gap-10 mb-4 pb-6 border-b border-txt-gray">
                    {/* Base Info */}
                    <div className="max-w-60">
                        <h3 className="text-txt-light mb-2 font-serif">TS. BS. Chế Đình Nghĩa</h3>
                        <p className="text-txt-gray ">
                            Tư vấn chuyên khoa chấn thương chỉnh hình — khớp gối, vai, háng. Hoạt động theo Thông tư 30/2023/TT-BYT.
                        </p>
                    </div>
                    <div className="sm:ml-auto text-txt-gray sm:min-w-40">
                        <h3 className="text-txt-gray  font-bold mb-2">THEO DÕI</h3>
                        <a href="https://www.youtube.com/@nghiachedinh" className=" font-bold hover:text-gold block my-1">YouTube</a>
                        <a href="https://www.tiktok.com/@tsnghia_xuongkhop" className=" font-bold hover:text-gold block my-1">TikTok</a>
                        <a href="https://web.facebook.com/BSNghiachuyenxuongkhop" className=" font-bold hover:text-gold block my-1">Facebook</a>
                    </div>
                    <div className="text-txt-gray sm:min-w-40">
                        <h3 className="text-txt-gray  font-bold mb-2">LIÊN HỆ</h3>
                        <a href="mailto:coxuongkhop.bsnghia@gmail.com" className=" font-bold hover:text-gold block my-1">Email</a>
                        <a href="#" className=" font-bold hover:text-gold block my-1">Chính sách bảo mật</a>
                        <a href="#" className=" font-bold hover:text-gold block my-1">Điều khoản dịch vụ</a>
                    </div>
                </div>

                <div className="text-txt-gray flex flex-col sm:flex-row">
                    <p className="text-center sm:text-left">© 2025 TS.BS Chế Đình Nghĩa</p>
                    <p className="sm:ml-auto text-center sm:text-left">Nội dung chỉ mang tính tư vấn, không thay thế khám lâm sàng trực tiếp khi cần thiết.</p>
                </div>
            </div>
        </div>
    )
}