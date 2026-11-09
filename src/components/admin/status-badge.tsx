import { ADMIN_STATUS_LABEL } from "@/lib/orders/progress";
import type { OrderStatus } from "@/lib/orders/types";
import type { PaymentStatus } from "@/lib/payments/types";
import { Badge, type Tone } from "./ui";

const ORDER_TONE: Record<OrderStatus, Tone> = {
  confirmed: "amber",
  in_production: "violet",
  ready: "green",
  dispatched: "blue",
  delivered: "neutral",
  cancelled: "red",
};

export function StatusBadge({ status, late }: { status: OrderStatus; late?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone={ORDER_TONE[status]}>{ADMIN_STATUS_LABEL[status]}</Badge>
      {late && <Badge tone="solidRed">Late</Badge>}
    </span>
  );
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  success: "Paid",
  failed: "Failed",
  abandoned: "Abandoned",
  refunded: "Refunded",
  partially_refunded: "Part refunded",
};
const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  success: "green",
  failed: "red",
  abandoned: "neutral",
  refunded: "amber",
  partially_refunded: "amber",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_LABEL[status]}</Badge>;
}
