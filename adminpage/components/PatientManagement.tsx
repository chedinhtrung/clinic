"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPaginationItems } from "./BlogEditor/utils";
import PatientNotesEditor from "./PatientNotesEditor";

type Patient = {
  id: string;
  name: string;
  birthdate: string | null;
  registrationDate: string | null;
  phone: string | null;
};

type BookingSummary = {
  id: string;
  reservationCode: number;
  status: string;
  createdAt: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  startAt: string | null;
  endAt: string | null;
};

type PatientProfile = {
  id: string;
  patientCode: number | null;
  name: string | null;
  birthdate: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  registrationDate: string | null;
  aiSummary: string | null;
  notes: string | null;
};

type PatientPageResponse = {
  patients: Patient[];
  page: number;
  pageSize: number;
  totalPatients: number;
  totalPages: number;
};

type LoadStatus = "idle" | "loading" | "error";
type SortBy = "name" | "registration_date";
type SortOrder = "asc" | "desc";
type NoteSaveStatus = "idle" | "saving" | "saved" | "error";

const PAGE_SIZE = 50;

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function calculateAge(birthdate: string | null) {
  if (!birthdate) return "-";
  const date = new Date(birthdate);
  if (Number.isNaN(date.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? String(age) : "-";
}

function formatGender(gender: string | null) {
  if (!gender) return "-";
  if (gender === "male") return "Male";
  if (gender === "female") return "Female";
  return gender;
}

function buildZaloUrl(phone: string | null) {
  if (!phone) return null;
  const normalizedPhone = phone.replace(/\D/g, "");
  if (!normalizedPhone) return null;
  return `https://zalo.me/${normalizedPhone}`;
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ecebe8] bg-[#fcfcfb] px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-[#8b8a86]">{label}</div>
      <div className="mt-1 text-sm text-[#37352f]">{value || "-"}</div>
    </div>
  );
}

export default function PatientManagement({
  onOpenBooking,
  patientToOpenId,
  onPatientOpened,
}: {
  onOpenBooking: (bookingId: string) => void;
  patientToOpenId: string | null;
  onPatientOpened: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [sortBy, setSortBy] = useState<SortBy>("registration_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchText, setSearchText] = useState("");
  const [activeSearchText, setActiveSearchText] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [profileLoadStatus, setProfileLoadStatus] = useState<LoadStatus>("idle");
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [bookingsLoadStatus, setBookingsLoadStatus] = useState<LoadStatus>("idle");
  const [notesDraft, setNotesDraft] = useState("");
  const [noteSaveStatus, setNoteSaveStatus] = useState<NoteSaveStatus>("idle");
  const noteSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isCurrentLoad = true;
    async function loadPatients() {
      setLoadStatus("loading");
      try {
        if (activeSearchText.trim()) {
          const params = new URLSearchParams({ q: activeSearchText.trim(), limit: String(PAGE_SIZE) });
          const response = await fetch(`/api/admin/patients/search?${params.toString()}`);
          const data = (await response.json().catch(() => ({}))) as { patients?: Patient[]; error?: string };
          if (!response.ok || !data.patients) throw new Error(data.error || "Could not load patients.");
          if (!isCurrentLoad) return;
          setPatients(data.patients);
          setPage(1);
          setTotalPages(1);
          setTotalPatients(data.patients.length);
        } else {
          const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sortBy, sortOrder });
          const response = await fetch(`/api/admin/patients?${params.toString()}`);
          const data = (await response.json().catch(() => ({}))) as PatientPageResponse & { error?: string };
          if (!response.ok) throw new Error(data.error || "Could not load patients.");
          if (!isCurrentLoad) return;
          setPatients(data.patients);
          setPage(data.page);
          setTotalPages(data.totalPages);
          setTotalPatients(data.totalPatients);
        }
        setLoadStatus("idle");
      } catch {
        if (isCurrentLoad) setLoadStatus("error");
      }
    }
    void loadPatients();
    return () => {
      isCurrentLoad = false;
    };
  }, [page, sortBy, sortOrder, activeSearchText]);

  useEffect(() => {
    if (!patientToOpenId) {
      return;
    }

    setSelectedPatientId(patientToOpenId);
    onPatientOpened();
  }, [patientToOpenId, onPatientOpened]);

  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      setProfileLoadStatus("idle");
      setBookings([]);
      setBookingsLoadStatus("idle");
      setNotesDraft("");
      setNoteSaveStatus("idle");
      return;
    }

    let isCurrentLoad = true;
    async function loadPatientProfile() {
      setProfileLoadStatus("loading");
      try {
        const response = await fetch(`/api/admin/patients/${selectedPatientId}`);
        const data = (await response.json().catch(() => ({}))) as { patient?: PatientProfile; error?: string };
        if (!response.ok || !data.patient) throw new Error(data.error || "Could not load patient profile.");
        if (!isCurrentLoad) return;
        setSelectedPatient(data.patient);
        setNotesDraft(data.patient.notes || "");
        setProfileLoadStatus("idle");
      } catch {
        if (isCurrentLoad) {
          setSelectedPatient(null);
          setProfileLoadStatus("error");
        }
      }
    }

    async function loadPatientBookings() {
      setBookingsLoadStatus("loading");
      try {
        const response = await fetch(`/api/admin/patients/${selectedPatientId}/bookings`);
        const data = (await response.json().catch(() => ({}))) as { bookings?: BookingSummary[]; error?: string };
        if (!response.ok || !data.bookings) throw new Error(data.error || "Could not load bookings.");
        if (!isCurrentLoad) return;
        setBookings(data.bookings);
        setBookingsLoadStatus("idle");
      } catch {
        if (isCurrentLoad) {
          setBookings([]);
          setBookingsLoadStatus("error");
        }
      }
    }

    void loadPatientProfile();
    void loadPatientBookings();

    return () => {
      isCurrentLoad = false;
    };
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId || !selectedPatient) return;
    if (notesDraft === (selectedPatient.notes || "")) return;

    if (noteSaveTimerRef.current) clearTimeout(noteSaveTimerRef.current);
    setNoteSaveStatus("saving");

    noteSaveTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/patients/${selectedPatientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesDraft }),
        });
        const data = (await response.json().catch(() => ({}))) as { patient?: { notes: string | null }; error?: string };
        if (!response.ok) throw new Error(data.error || "Could not save notes.");
        setSelectedPatient((current) => (current ? { ...current, notes: data.patient?.notes ?? notesDraft } : current));
        setNoteSaveStatus("saved");
      } catch {
        setNoteSaveStatus("error");
      }
    }, 700);

    return () => {
      if (noteSaveTimerRef.current) clearTimeout(noteSaveTimerRef.current);
    };
  }, [notesDraft, selectedPatientId, selectedPatient]);

  const paginationItems = useMemo(() => createPaginationItems(page, totalPages), [page, totalPages]);

  function toggleSort(nextSortBy: SortBy) {
    if (activeSearchText.trim()) {
      return;
    }
    setPage(1);
    setSortOrder((currentOrder) => (sortBy === nextSortBy ? (currentOrder === "asc" ? "desc" : "asc") : nextSortBy === "name" ? "asc" : "desc"));
    setSortBy(nextSortBy);
  }

  function submitSearch() {
    setActiveSearchText(searchText.trim());
    setPage(1);
  }

  function sortIndicator(column: SortBy) {
    if (sortBy !== column) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  }

  return (
    <main className="relative flex min-w-0 flex-1 overflow-hidden bg-[#fbfbfa] text-[#37352f]">
      <section className="flex min-w-0 flex-1 flex-col px-10 py-8">
        <div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-[#37352f]">Bệnh nhân</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">Danh sách và hồ sơ bệnh nhân đã đăng ký lịch hẹn.</p>
        </div>
        <div className="mt-6 max-w-xl">
          <label className="block">
            <span className="text-xs font-medium text-[#787774]">Search by name, phone, or id</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
              onBlur={submitSearch}
              placeholder="Nguyen Van A, 090..., or patient id"
              className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#b9b8b4]"
            />
          </label>
        </div>

        <div className="mt-6 overflow-hidden border-y border-[#e3e2df] bg-white">
          <div className="grid grid-cols-[2fr_1.2fr_1.4fr_1.2fr] border-b border-[#e3e2df] bg-[#f7f6f3] px-3 py-2 text-xs font-medium text-[#787774]">
            <button type="button" onClick={() => toggleSort("name")} className="text-left hover:text-[#37352f]">Name{sortIndicator("name")}</button>
            <div>Birth Date</div>
            <button type="button" onClick={() => toggleSort("registration_date")} className="text-left hover:text-[#37352f]">Registration Date{sortIndicator("registration_date")}</button>
            <div>Phone</div>
          </div>

          <div className="max-h-[calc(100vh-17rem)] overflow-y-auto">
            {patients.length === 0 && <div className="px-4 py-8 text-center text-sm text-[#787774]">{loadStatus === "loading" ? "Loading patients..." : loadStatus === "error" ? "Could not load patients." : "No patients found."}</div>}
            {patients.map((patient) => {
              const isSelected = selectedPatientId === patient.id;
              return (
                <div key={patient.id} onClick={() => setSelectedPatientId(patient.id)} role="button" tabIndex={0} onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedPatientId(patient.id);
                  }
                }} className={`grid cursor-pointer grid-cols-[2fr_1.2fr_1.4fr_1.2fr] items-center border-b border-[#efefed] px-3 py-2 text-sm transition hover:bg-[#f7f6f3] ${isSelected ? "bg-[#f1f1ef]" : "bg-white"}`}>
                  <div className="truncate font-medium text-[#37352f]">{patient.name || "-"}</div>
                  <div className="text-[#787774]">{formatDate(patient.birthdate)}</div>
                  <div className="text-[#787774]">{formatDate(patient.registrationDate)}</div>
                  <div className="text-[#787774]">
                    {patient.phone ? (
                      <a
                        href={buildZaloUrl(patient.phone) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="underline decoration-dotted underline-offset-2 hover:text-[#37352f]"
                      >
                        {patient.phone}
                      </a>
                    ) : "-"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#e3e2df] px-3 py-3 text-sm text-[#787774]">
            <div>{totalPatients === 0 ? "0 patients" : `Page ${page} of ${totalPages} - ${totalPatients} patients`}</div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || totalPages === 1 || loadStatus === "loading"} className="rounded px-2 py-1 transition hover:bg-[#f1f1ef] disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
              {paginationItems.map((item, index) => item === "..." ? <span key={`ellipsis-${index}`} className="px-2 py-1 text-[#b9b8b4]">...</span> : <button key={item} type="button" onClick={() => setPage(item)} disabled={loadStatus === "loading"} className={`rounded px-2 py-1 transition hover:bg-[#f1f1ef] disabled:cursor-not-allowed disabled:opacity-40 ${item === page ? "bg-[#37352f] text-white hover:bg-[#37352f]" : ""}`}>{item}</button>)}
              <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 1 || loadStatus === "loading"} className="rounded px-2 py-1 transition hover:bg-[#f1f1ef] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </section>

      {selectedPatientId && <div className="absolute inset-0 z-20 bg-[#37352f]/10 backdrop-blur-[1px]" onClick={() => setSelectedPatientId(null)} />}

      <aside className={`absolute bottom-0 right-0 top-0 z-30 flex w-full max-w-[56vw] flex-col border-l border-[#e3e2df] bg-white shadow-[-24px_0_50px_rgba(55,53,47,0.16)] transition-transform duration-300 ${selectedPatientId ? "translate-x-0" : "translate-x-full"}`}>
        {selectedPatientId && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-[#e3e2df] px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-[#787774]">Patient Profile</p>
                <p className="mt-1 text-sm text-[#37352f]">{selectedPatient?.name || "Loading..."}</p>
              </div>
              <button type="button" aria-label="Close profile" onClick={() => setSelectedPatientId(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none text-[#787774] transition hover:bg-[#f1f1ef] hover:text-[#37352f]">x</button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {profileLoadStatus === "loading" && <p className="text-sm text-[#787774]">Loading patient profile...</p>}
              {profileLoadStatus === "error" && <p className="text-sm text-[#b94034]">Could not load patient profile.</p>}

              {profileLoadStatus === "idle" && selectedPatient && (
                <>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[#1f1f1d]">{selectedPatient.name || "-"}</h3>
                    <p className="mt-1 text-sm text-[#787774]">Patient code: {selectedPatient.patientCode ?? "-"}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <ProfileField label="Birth date" value={formatDate(selectedPatient.birthdate)} />
                    <ProfileField label="Age" value={calculateAge(selectedPatient.birthdate)} />
                    <ProfileField label="Sex" value={formatGender(selectedPatient.gender)} />
                    <ProfileField label="Registration date" value={formatDate(selectedPatient.registrationDate)} />
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wide text-[#8b8a86]">Contact</h4>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <ProfileField label="Email" value={selectedPatient.email || "-"} />
                      <div className="rounded-md border border-[#ecebe8] bg-[#fcfcfb] px-3 py-2">
                        <div className="text-xs font-medium uppercase tracking-wide text-[#8b8a86]">Phone</div>
                        <div className="mt-1 text-sm text-[#37352f]">
                          {selectedPatient.phone ? (
                            <a
                              href={buildZaloUrl(selectedPatient.phone) || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-dotted underline-offset-2 hover:text-[#111]"
                            >
                              {selectedPatient.phone}
                            </a>
                          ) : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium uppercase tracking-wide text-[#8b8a86]">Doctor Notes</h4>
                      <span className={`text-xs ${noteSaveStatus === "error" ? "text-[#b94034]" : "text-[#8b8a86]"}`}>{noteSaveStatus === "saving" ? "Saving..." : noteSaveStatus === "saved" ? "Saved" : noteSaveStatus === "error" ? "Save failed" : "Not saved yet"}</span>
                    </div>
                    <div className="mt-2 rounded-md border border-[#e3e2df] bg-white p-2">
                      <PatientNotesEditor value={notesDraft} onChange={setNotesDraft} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wide text-[#8b8a86]">Bookings</h4>
                    {bookingsLoadStatus === "loading" && <p className="mt-2 text-sm text-[#787774]">Loading bookings...</p>}
                    {bookingsLoadStatus === "error" && <p className="mt-2 text-sm text-[#b94034]">Could not load bookings.</p>}
                    {bookingsLoadStatus === "idle" && bookings.length === 0 && <p className="mt-2 text-sm text-[#787774]">No bookings in pending/confirmed/finished states.</p>}
                    {bookingsLoadStatus === "idle" && bookings.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {bookings.map((booking) => (
                          <button
                            key={booking.id}
                            type="button"
                            onClick={() => onOpenBooking(booking.id)}
                            className="w-full rounded-md border border-[#ecebe8] bg-[#fcfcfb] px-3 py-2 text-left transition hover:border-[#d7d5d0] hover:bg-[#f7f6f3]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-[#37352f]">#{booking.reservationCode}</span>
                              <span className="rounded bg-[#f1f1ef] px-2 py-0.5 text-xs text-[#5f5e5b]">{booking.status}</span>
                            </div>
                            <div className="mt-1 text-xs text-[#787774]">{formatDateTime(booking.startAt)} - {formatDateTime(booking.endAt)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wide text-[#8b8a86]">Clinical note summary</h4>
                    <div className="mt-2 rounded-md border border-[#ecebe8] bg-[#fcfcfb] px-3 py-3 text-sm leading-6 text-[#37352f]">{selectedPatient.aiSummary || "No summary yet."}</div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
