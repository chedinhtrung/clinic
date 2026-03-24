export default function Intro(){
    return(
        <div className="flex justify-center">
        <div className="max-w-[1100px] px-20 wx-auto">
            
            {/* Avatar */}
            <div className="relative h-20">
            <div className="bg-[position:center_40%] bg-[url('/images/bsnghia.jpeg')] bg-cover h-28 w-28 absolute left-8 top-[-50px]
                rounded-full border-4 border-bg-light shadow-xl">
            </div>
            </div> 


            <div className="mx-8 flex flex-col sm:flex-row gap-5 sm:gap-20">
            <div className="text-xs text-txt-dark leading-loose ">
                
                <p className="mb-4">
                Tốt nghiệp loại Giỏi Đại học Y Hà Nội, Tiến sĩ chuyên ngành Chấn thương Chỉnh hình. Gần 20 năm làm việc tại Bệnh viện Trung ương Quân đội 108, tích lũy kinh nghiệm điều trị các ca bệnh phức tạp về xương khớp.
                </p>
               <p>
                 <span className="font-bold">Chuyên sâu:</span> <br></br>

                    ✦Phẫu thuật thay khớp gối, thay khớp háng không cắt cơ (SuperPath, ABMS) <br></br> 
                    ✦Nội soi tái tạo dây chằng (chéo trước, chéo sau) · Nội soi vai khâu gân chóp xoay <br></br>
                    ✦Liệu pháp PRP điều trị chấn thương thể thao & thoái hóa khớp <br></br>

                <i className="text-txt-light-gray">Tiên phong ứng dụng 3D và cá thể hóa phẫu thuật (PSI) nhằm nâng cao độ chính xác.</i>
               </p>
            </div>
            <div className="flex sm:flex-col flex-row gap-2 sm:max-w-40 w-full justify-center">
                <div className="flex flex-col justify-center items-center p-3 bg-bg-faded rounded-md w-full shadow-sm">
                    <div className="text-txt-primary font-bold">25+</div>
                    <div className="text-txt-gray text-[0.5rem] lg:text-[0.7rem]">Năm kinh nghiệm</div>
                </div>
                <div className="flex flex-col justify-center items-center p-3 bg-bg-faded rounded-md w-full shadow-sm">
                    <div className="text-txt-primary font-bold">3</div>
                    <div className="text-txt-gray text-[0.5rem] lg:text-[0.7rem]">BV lớn nhất VN</div>
                </div>
                <div className="flex flex-col justify-center items-center p-3 bg-bg-faded rounded-md w-full shadow-sm">
                    <div className="text-txt-primary font-bold">TS.</div>
                    <div className="text-txt-gray text-[0.5rem] lg:text-[0.7rem]">Tiến sỹ Y khoa</div>
                </div>
            </div>
           
            </div>
            
        </div>
        </div>
    )
}