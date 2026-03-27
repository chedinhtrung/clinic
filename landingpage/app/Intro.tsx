export default function Intro(){
    return(
        <div className="flex justify-center mb-10 md:text-lg">
        <div className="max-w-[1500px] sm:px-20 px-6 wx-auto">
            
            {/* Avatar */}
            <div className="relative h-30">
                <div className="bg-[position:center_40%] bg-[url('/images/bsnghia.jpeg')] bg-cover h-40 w-40 absolute left-0 top-[-80px]
                    rounded-full border-4 border-bg-light shadow-xl">
                </div>
            </div> 

            {/* Intro text */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-20">
                <div className="text-txt-dark leading-loose ">
                    
                    <p className="mb-4">
                    Tốt nghiệp loại Giỏi Đại học Y Hà Nội, Tiến sĩ chuyên ngành Chấn thương Chỉnh hình. Gần 20 năm làm việc tại Bệnh viện Trung ương Quân đội 108, tích lũy kinh nghiệm điều trị các ca bệnh phức tạp về xương khớp.
                    </p>
                <p>
                    <span className="font-bold">Chuyên sâu:</span> <br></br>

                        <span className="text-primary">✦</span> Phẫu thuật thay khớp gối, thay khớp háng không cắt cơ (SuperPath, ABMS) <br></br> 
                        <span className="text-primary">✦</span> Nội soi tái tạo dây chằng (chéo trước, chéo sau) · Nội soi vai khâu gân chóp xoay <br></br>
                        <span className="text-primary">✦</span> Liệu pháp PRP điều trị chấn thương thể thao & thoái hóa khớp <br></br>

                    <i className="text-txt-light-gray">Tiên phong ứng dụng 3D và cá thể hóa phẫu thuật (PSI) nhằm nâng cao độ chính xác.</i>
                </p>
                </div>

                {/* highlights */}
                <div className="flex sm:flex-col flex-row gap-2 sm:max-w-40 w-full justify-center">
                    <div className="flex flex-col justify-center items-center p-3 bg-primary-light rounded-md w-full shadow-sm">
                        <div className="text-txt-primary font-bold">25+</div>
                        <div className="text-txt-gray text-[0.8rem] lg:text-sm text-center">Năm kinh nghiệm</div>
                    </div>
                    <div className="flex flex-col justify-center items-center p-3 bg-primary-light rounded-md w-full shadow-sm">
                        <div className="text-txt-primary font-bold">3</div>
                        <div className="text-txt-gray text-[0.8rem] lg:text-sm text-center">BV lớn nhất VN</div>
                    </div>
                    <div className="flex flex-col justify-center items-center p-3 bg-primary-light rounded-md w-full shadow-sm">
                        <div className="text-txt-primary font-bold">TS.</div>
                        <div className="text-txt-gray text-[0.8rem] lg:text-sm text-center">Tiến sỹ Y khoa</div>
                    </div>
                </div>

            </div>
            
        </div>
        </div>
    )
}