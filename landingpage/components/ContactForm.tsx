"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { withApiBase } from "@/app/apiBase";

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
  message?: string;
}

function formatBirthdateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join("/");
}

function formatBirthdateForDisplay(value: string) {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  return formatBirthdateInput(value);
}

function birthdateDisplayToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return value;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

export default function ContactForm({
  confirmed = false,
  nextStep = "payment",
  initialValues,
}: {
  confirmed?: boolean;
  nextStep?: "payment" | "email";
  initialValues?: Partial<ContactFormValues>;
}) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    birthdate: formatBirthdateForDisplay(initialValues?.birthdate ?? ""),
    gender: initialValues?.gender ?? "",
    message: initialValues?.message ?? "",
  })

  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      birthdate: formatBirthdateForDisplay(initialValues?.birthdate ?? ""),
      gender: initialValues?.gender ?? "",
      message: initialValues?.message ?? "",
    }))
  }, [
    initialValues?.birthdate,
    initialValues?.email,
    initialValues?.gender,
    initialValues?.message,
    initialValues?.name,
    initialValues?.phone,
  ])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.name === "birthdate"
        ? formatBirthdateInput(e.target.value)
        : e.target.value;

    setForm({
      ...form,
      [e.target.name]: value,
    })
  }

  function handleGenderChange(value: string) {
    setForm((current) => ({
      ...current,
      gender: current.gender === value ? "" : value,
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true);
    try {
      const res = await fetch(withApiBase("/api/booking/prepare_booking_confirmation"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          birthdate: birthdateDisplayToIso(form.birthdate),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data?.error ?? "Khong the tiep tuc thanh toan");
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }

      const destination = nextStep === "email" ? "/confirmation" : "/payment";
      router.push(`${destination}?bookingId=${encodeURIComponent(data.booking.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Khong the tiep tuc thanh toan";
      alert(message);
      const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined;
      if (status !== 409) {
        router.push("#");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onCancelBooking() {
    setIsCancelling(true);
    try {
      const res = await fetch(withApiBase("/api/booking/cancel"), {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Không hủy được giữ chỗ. Vui lòng thử lại.");
      }

      alert("Giữ chỗ của bạn đã được hủy thành công.");
      router.push("/");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không hủy được giữ chỗ. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ngày sinh <span className="text-red-500">*</span></label>
        <input
          name="birthdate"
          type="text"
          value={form.birthdate}
          onChange={handleChange}
          className="w-full border rounded p-2"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          pattern="\d{2}/\d{2}/\d{4}"
          maxLength={10}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium mb-1">Giới tính</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-txt-gray">
            <input
              type="checkbox"
              checked={form.gender === "male"}
              onChange={() => handleGenderChange("male")}
              className="h-4 w-4 accent-primary"
            />
            Nam
          </label>
          <label className="flex items-center gap-2 text-sm text-txt-gray">
            <input
              type="checkbox"
              checked={form.gender === "female"}
              onChange={() => handleGenderChange("female")}
              className="h-4 w-4 accent-primary"
            />
            Nữ
          </label>
        </div>
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium mb-1">Ghi chú</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="Bạn có điều gì muốn nhắn nhủ?"
          rows={4}
        />
      </div>
      <button
        type="button"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm disabled:opacity-60 mb-0"
        onClick={onCancelBooking}
        disabled={isCancelling}
      >
        {isCancelling ? "Đang hủy..." : "Hủy giữ chỗ"}
      </button>
      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-bold sm:text-sm text-xs disabled:opacity-60"
        disabled={isSubmitting}
      >
        {confirmed ? `CHỈNH SỬA` : `XÁC NHẬN ĐẶT CHỖ `}
      </button>
      
    </form>
  )
}
