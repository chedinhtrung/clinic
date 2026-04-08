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
}

function PaymentResultPageContent() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<PaymentResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const query = searchParams.toString();
        if (!query) {
            setErrorMessage("Khong co du lieu tra ve tu VNPay.");
            return;
        }

        const verifyResult = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/payment/vnpay/return?${query}`, {
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
                <h1 className="mb-4 text-3xl font-bold text-primary">KET QUA THANH TOAN</h1>
                {errorMessage ? (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                ) : result ? (
                    <div className="space-y-3">
                        <p className={result.confirmed ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                            {result.confirmed ? "Thanh toán thành công" : "Thanh toán không thành công"}
                        </p>
                        <p className="text-txt-gray">Mã đặt chỗ: {result.reservationCode}</p>
                        <p className="text-txt-gray">Mã phản hồi VNPay: {result.responseCode}</p>
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
