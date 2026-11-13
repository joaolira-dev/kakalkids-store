import type { Metadata } from "next";
import { Suspense } from "react";
import { CouponManager } from "@/components/admin/coupon-manager";
import { couponState, listCoupons } from "@/lib/admin/coupons";

export const metadata: Metadata = { title: "Cupons" };

export default function CouponsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-3xl sm:text-4xl">Cupons</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-80 animate-pulse rounded-3xl bg-creme-dark" />}>
        <Coupons />
      </Suspense>
    </div>
  );
}

async function Coupons() {
  const coupons = await listCoupons();
  const now = new Date();
  return <CouponManager coupons={coupons.map((c) => ({ ...c, state: couponState(c, now) }))} />;
}
