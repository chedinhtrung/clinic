"use client"

import Image from "next/image";

const expertise = [
  "Chấn thương chỉnh hình và phẫu thuật tạo hình",
  "Vi phẫu phục hồi chi thể và tổn thương phức tạp",
  "Điều trị liệt mặt, liệt đám rối cánh tay",
  "Tái tạo tuyến vú và điều trị phù bạch mạch",
];

const milestones = [
  "2001: Tốt nghiệp Đại học Y Hà Nội",
  "2007: Hoàn thành Thạc sĩ Ngoại khoa",
  "2019: Nhận bằng Tiến sĩ Y học tại Viện 108",
  "2005 - 2022: Bác sĩ điều trị, Bệnh viện TWQĐ 108",
  "2023 - nay: Bác sĩ điều trị, Hệ thống BVĐK Tâm Anh",
];

export default function Profile() {
  return (
    <section className="bg-white px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            Hồ sơ chuyên gia
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            TS.BS. Chế Đình Nghĩa
          </h2>
          <p className="mt-4 text-base leading-8 text-navy-mid/80 sm:text-lg">
            Hơn 20 năm công tác trong ngành y, TS.BS Chế Đình Nghĩa là chuyên gia
            giàu kinh nghiệm trong chấn thương chỉnh hình và phẫu thuật tạo hình.
            Bác sĩ đã điều trị nhiều ca bệnh phức tạp bằng kỹ thuật ít xâm lấn,
            giúp giảm đau, hạn chế biến chứng và rút ngắn thời gian hồi phục cho
            người bệnh.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="overflow-hidden rounded-sm bg-[#f6f1e7]">
            <Image
              src="/images/bsnghia2.webp"
              alt="TS.BS. Chế Đình Nghĩa"
              width={1200}
              height={1400}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                Điểm nhấn chuyên môn
              </p>
              <p className="mt-4 text-sm leading-7 text-navy-mid/85 sm:text-base">
                Bác sĩ có thế mạnh trong chấn thương chỉnh hình, phẫu thuật tạo
                hình và vi phẫu phục hồi các tổn thương phức tạp, với định hướng
                điều trị chính xác, ít xâm lấn và tối ưu khả năng hồi phục cho
                người bệnh.
              </p>
              <div className="mt-5 space-y-3">
                {expertise.map((item) => (
                  <p key={item} className="border-b border-black/10 pb-3 text-sm leading-7 text-navy-mid">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                Học tập và công tác
              </p>
              <div className="mt-5 space-y-4">
                {milestones.map((item) => (
                  <p
                    key={item}
                    className="border-b border-black/10 pb-4 text-sm leading-7 text-navy-mid last:border-b-0 last:pb-0"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                Định hướng chuyên môn
              </p>
              <p className="mt-4 text-sm leading-7 text-navy-mid/85 sm:text-base">
                Bên cạnh điều trị lâm sàng, bác sĩ còn tích cực nghiên cứu khoa học
                và ứng dụng kỹ thuật vi phẫu hiện đại nhằm nâng cao hiệu quả điều
                trị, phục hồi chức năng và chất lượng sống cho người bệnh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
