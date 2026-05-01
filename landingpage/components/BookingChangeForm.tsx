"use client"

import { useEffect, useState } from "react";

type BookingChangeFormValues = {
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: string;
  message: string;
}

export default function BookingChangeForm({
  initialValues,
  onSubmit,
  onCancelBooking,
}: {
  initialValues?: Partial<BookingChangeFormValues>;
  onSubmit: (values: BookingChangeFormValues) => Promise<void>;
  onCancelBooking: () => Promise<void>;
}) {
  const [form, setForm] = useState<BookingChangeFormValues>({
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    birthdate: initialValues?.birthdate ?? "",
    gender: initialValues?.gender ?? "",
    message: initialValues?.message ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setForm({
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      birthdate: initialValues?.birthdate ?? "",
      gender: initialValues?.gender ?? "",
      message: initialValues?.message ?? "",
    });
  }, [
    initialValues?.birthdate,
    initialValues?.email,
    initialValues?.gender,
    initialValues?.message,
    initialValues?.name,
    initialValues?.phone,
  ]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  }

  function handleGenderChange(value: string) {
    setForm((current) => ({
      ...current,
      gender: current.gender === value ? "" : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelBooking() {
    const confirmed = window.confirm("Bạn chắc chắn muốn hủy lịch hẹn này?");
    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    try {
      await onCancelBooking();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không hủy được lịch hẹn. Vui lòng thử lại.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">Họ và tên<span className="text-red-500">*</span></label>
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
          type="date"
          value={form.birthdate}
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
        onClick={handleCancelBooking}
        disabled={isCancelling}
      >
        {isCancelling ? "Đang hủy..." : "Hủy lịch hẹn"}
      </button>
      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-bold sm:text-sm text-xs disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}
