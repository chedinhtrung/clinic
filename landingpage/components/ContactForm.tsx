"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
}

export default function ContactForm({
  confirmed = false,
  initialValues,
}: {
  confirmed?: boolean;
  initialValues?: Partial<ContactFormValues>;
}) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    birthdate: initialValues?.birthdate ?? "",
    gender: initialValues?.gender ?? "",
    message: "",
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
      birthdate: initialValues?.birthdate ?? "",
      gender: initialValues?.gender ?? "",
    }))
  }, [
    initialValues?.birthdate,
    initialValues?.email,
    initialValues?.gender,
    initialValues?.name,
    initialValues?.phone,
  ])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/booking/proceed_to_payment", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data?.error ?? "Khong the tiep tuc thanh toan");
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }

      router.push(`/payment?bookingId=${encodeURIComponent(data.booking.id)}`);
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
      await fetch("/api/booking/cancel", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("#");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md grid grid-cols-2 gap-3">
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
        <label className="block text-sm font-medium mb-1">Số điện thoại</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ngày sinh <span className="text-red-500">*</span></label>
        <input
          name="birthdate"
          type="date"
          value={form.birthdate}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Giới tính <span className="text-red-500">*</span></label>
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full border rounded p-2 bg-white"
          required
        >
          <option value=""></option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ghi chú</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          className="w-full border rounded p-2"
          placeholder="Bạn có điều gì muốn nhắn nhủ?"
          rows={3}
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
