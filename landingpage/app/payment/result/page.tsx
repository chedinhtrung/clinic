"use client"

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PaymentResult = {
    ok: boolean;
    bookingId: string;
    reservationCode: string;
    responseCode: string;
    transactionStatus: string;
    confirmed: boolean;
    confirmedAt?: string | null;
    paymentVerified: string;
}

function PaymentResultPageContent() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<PaymentResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const query = searchParams.toString();
        if (!query) {
            setErrorMessage("Không có dữ liệu giao dịch.");
            return;
        }

        const verifyResult = async () => {
            try {
                const res = await fetch(`/api/payment/vnpay/return?${query}`, {
                    credentials: "include",
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error ?? "Không xác minh được giao dịch.");
                }

                setResult(data.result);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Không xác minh được giao dịch.");
            }
        };

        verifyResult();
    }, [searchParams]);

    return (
        <div className="flex justify-center p-6 sm:p-10 bg-tinted-gray">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
                <h1 className="mb-4 text-3xl font-bold text-primary">
                    {result ? (result.paymentVerified ? "Thanh toán thành công" : "Thanh toán không thành công") : "Lỗi thanh toán"}
                </h1>
                {errorMessage ? (
                    <p className="text-sm text-red-500">Lỗi thanh toán: {errorMessage}</p>
                ) : result ? (
                    <div className="space-y-3">
                        <p className={result.paymentVerified ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                            {result.paymentVerified ? "Thanh toán thành công" : "Thanh toán không thành công"}
                        </p>
                        <p className="text-txt-gray">Mã đặt chỗ: {result.reservationCode}</p>
                        <p className="text-txt-gray">Trạng thái giao dịch: {result.transactionStatus || "-"}</p>
                    </div>
                ) : (
                    <p className="text-txt-gray">Đang xác minh giao dịch...</p>
                )}
            </div>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={<div className="bg-tinted-gray p-6 sm:p-10" />}>
            <PaymentResultPageContent />
        </Suspense>
    );
}
