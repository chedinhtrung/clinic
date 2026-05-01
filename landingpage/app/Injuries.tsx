"use client";

type InjuryGroup = {
  title: string;
  items: string[];
};

type InjuryCard = {
  icon: string;
  title: string;
  badge: string;
  description: string;
  tags: string[];
  href: string;
};

const groups: InjuryGroup[] = [
  {
    title: "Dây chằng",
    items: ["Đứt dây chằng ACL", "Tổn thương PCL", "Rách MCL / LCL"],
  },
  {
    title: "Sụn khớp & sụn chêm",
    items: ["Rách sụn chêm", "Thoái hóa khớp (OA)", "Tổn thương sụn khớp"],
  },
  {
    title: "Xương",
    items: ["Gãy xương phức tạp", "Loãng xương"],
  },
  {
    title: "Y học thể thao",
    items: ["Chấn thương vai", "Chấn thương cổ chân"],
  },
];

const featuredInjuries: InjuryCard[] = [
  {
    icon: "🔗",
    title: "Đứt Dây Chằng Chéo Trước (ACL)",
    badge: "Phổ biến nhất",
    description:
      "Đứt ACL là chấn thương khớp gối nghiêm trọng, phổ biến ở vận động viên. Biểu hiện: tiếng \"bụp\", sưng nề nhanh, mất vững khớp gối. Chẩn đoán qua nghiệm pháp Lachman, Pivot Shift và MRI. Điều trị phẫu thuật nội soi tái tạo gần ghép tự thân.",
    tags: ["Nội soi", "Gân ghép tự thân", "Phục hồi 6-9 tháng"],
    href: "/injuries/dut-day-chang-cheo-truoc-acl",
  },
  {
    icon: "🌀",
    title: "Rách Sụn Chêm",
    badge: "Thường gặp",
    description:
      "Sụn chêm là hai miếng sụn hình chữ C trong khớp gối, hấp thụ lực và bôi trơn khớp. Rách sụn chêm do chấn thương cấp hoặc thoái hóa. Điều trị: bảo tồn hoặc phẫu thuật nội soi khâu / cắt bán phần.",
    tags: ["Khâu sụn chêm", "Cắt bán phần", "Nội soi"],
    href: "/injuries/rach-sun-chem",
  },
  {
    icon: "🦴",
    title: "Gãy Xương Phức Tạp",
    badge: "Cần đánh giá sớm",
    description:
      "Các trường hợp gãy xương nhiều mảnh, gãy phạm khớp hoặc kèm tổn thương phần mềm cần được đánh giá hình ảnh kỹ lưỡng. Mục tiêu điều trị là phục hồi trục chi, vững khớp và chức năng vận động lâu dài.",
    tags: ["X-quang / CT", "Kết hợp xương", "Phục hồi chức năng"],
    href: "/injuries/gay-xuong-phuc-tap",
  },
];

export default function Injuries() {
  return (
    <section id="phau-thuat" className="bg-[#f7f9fc] px-3 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="overflow-hidden border border-[#d7dfed] bg-white shadow-[0_14px_34px_rgba(10,35,66,0.06)]">
          <div className="bg-navy px-5 py-6">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">
              Danh mục
            </h2>
          </div>

          <div>
            {groups.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? "border-t border-[#d7dfed]" : ""}>
                <h3 className="px-5 pt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[#97a7c3]">
                  {group.title}
                </h3>
                <ul className="py-2">
                  {group.items.map((item, itemIndex) => {
                    const isActive = groupIndex === 0 && itemIndex === 0;

                    return (
                      <li key={item}>
                        <button
                          type="button"
                          className={`w-full px-5 py-3 text-left text-[15px] transition ${
                            isActive
                              ? "border-l-2 border-navy bg-[#eef3fb] font-semibold text-navy"
                              : "text-[#607291] hover:bg-[#f5f8fc] hover:text-navy"
                          }`}
                        >
                          {item}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <div className="max-h-[44rem] space-y-8 overflow-y-auto pr-2
        [scrollbar-width:none] [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden">
          {featuredInjuries.map((injury) => (
            <a
              key={injury.title}
              href={injury.href}
              className="block border border-[#d7dfed] bg-white p-8 shadow-[0_18px_36px_rgba(10,35,66,0.07)] transition hover:border-navy/40 hover:shadow-[0_22px_42px_rgba(10,35,66,0.1)] sm:p-10"
            >
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef1ff] text-3xl">
                  {injury.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-3xl font-black tracking-tight text-navy">
                    {injury.title}
                  </h3>
                  <div className="mt-3 inline-flex rounded-sm bg-gold px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-white">
                    {injury.badge}
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-4xl text-lg leading-9 text-[#5a6d8f]">
                {injury.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {injury.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#edf1f7] px-4 py-2 text-sm text-[#627392]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
