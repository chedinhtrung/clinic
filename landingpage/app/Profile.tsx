"use client"

import Image from "next/image";

const expertise = [
  "Đa chấn thương, gãy xương phức tạp",
  "Tổn thương dây chằng ACL, PCL, MCL, sụn chêm",
  "Thay khớp ít xâm lấn: khớp gối, khớp háng nhân tạo",
  "Chấn thương vận động viên",
  "Điều trị PRP & Tế bào gốc",
];

const milestones = [
  {
    period: "2023 - nay",
    title: "Phó khoa Chấn thương Chỉnh hình",
    organization: "Hệ thống Bệnh viện Đa khoa Tâm Anh",
  },
  {
    period: "2005 - 2022",
    title: "Bác sĩ điều trị",
    organization: "Bệnh viện Trung ương Quân đội 108",
  },
  {
    period: "2011 - 2019",
    title: "Tiến sĩ Y học",
    organization: "Viện Nghiên cứu Khoa học Y dược lâm sàng 108",
  },
  {
    period: "2005 - 2007",
    title: "Thạc sĩ Ngoại khoa",
    organization: "Đại học Y Hà Nội",
  },
  {
    period: "1995 - 2001",
    title: "Bác sĩ Đa khoa",
    organization: "Đại học Y Hà Nội",
  },
];

export default function Profile() {
  return (
    <section className="bg-white px-6 py-14 text-navy-dark sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-4xl">
          <div className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            Hồ sơ chuyên gia
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight sm:text-4xl">
            TS. BS. Chế Đình Nghĩa
          </h2>
          <p className="mt-4 text-base leading-8 text-navy-mid/80 sm:text-lg">
            <span className="font-bold">Với hơn 20 năm công tác tại Bệnh viện Trung ương Quân đội 108</span>, TS. BS. Chế Đình Nghĩa là chuyên gia
            hàng đầu về chấn thương chỉnh hình và phẫu thuật tạo hình.
            Bác sĩ đã điều trị nhiều ca bệnh phức tạp bằng kỹ thuật ít xâm lấn,
            giúp hàng ngàn bệnh nhân giảm đau, phục hồi vận động, rút ngắn thời gian hồi phục và tránh phẫu thuật không cần thiết.
          </p>
        </div>

        <div className="grid gap-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="overflow-hidden rounded-sm bg-[#f6f1e7]">
            <Image
              src="/images/bsnghia.png"
              alt="TS.BS. Chế Đình Nghĩa"
              width={900}
              height={1200}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-gold">
                Điểm nhấn chuyên môn
              </p>
              <p className="mt-4 text-sm leading-7 text-navy-mid/85 sm:text-base">
                Các lĩnh vực chuyên môn nổi bật bao gồm:
              </p>
              <div className="mt-2 space-y-1">
                {expertise.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span>•</span>
                    <p className="text leading-7 text-navy-mid sm:text-base">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-gold">
                Học tập và công tác
              </p>
              <div className="mt-6 border-l border-[#d7dfed] pl-6">
                {milestones.map((item) => (
                  <div key={item.period} className="relative pb-3 last:pb-0">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gold" />
                    <p className="text-sm font-semibold text-gray-500">{item.period}</p>
                    <h3 className="font-bold text-navy-dark">
                      {item.title}
                    </h3>
                    <p className="text-navy-mid/90">
                      {item.organization}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
