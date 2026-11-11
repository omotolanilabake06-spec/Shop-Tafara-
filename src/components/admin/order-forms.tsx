"use client";

import { useActionState, useState } from "react";
import { type FormState, addOrderNote, cancelOrderAction, deleteOrderAction } from "@/app/admin/actions";
import { Card, button, textarea } from "./ui";

export function NoteForm({ number }: { number: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addOrderNote, {});
  return (
    <form action={action}>
      <input type="hidden" name="number" value={number} />
      <textarea name="text" rows={3} placeholder="e.g. Customer called to confirm the hem length." className={`${textarea} min-h-[84px]`} />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className={button.secondary} disabled={pending}>
          {pending ? "Saving…" : "Add note"}
        </button>
        {state.error && <p className="text-[14px] text-sold">{state.error}</p>}
      </div>
    </form>
  );
}

export function CancelOrder({ number, canRefund }: { number: string; canRefund: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(cancelOrderAction, {});
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={button.danger}>
        Cancel order…
      </button>
    );
  }
  return (
    <form action={action} className="rounded-[4px] border border-sold/40 bg-[#fcf4f2] p-5">
      <input type="hidden" name="number" value={number} />
      <p className="text-[16px] font-medium text-sold">Cancel this order?</p>
      <p className="mt-1 text-[14px] text-soft">The customer is not emailed automatically; contact them first.</p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[14px] font-medium">Reason (kept on the order)</span>
        <textarea name="reason" rows={2} className={`${textarea} min-h-[64px]`} placeholder="e.g. Customer changed their mind before cutting" />
      </label>
      {canRefund && (
        <label className="mt-4 flex items-start gap-2.5 text-[15px]">
          <input type="checkbox" name="refund" defaultChecked className="mt-1 h-4 w-4 accent-[#9a3b2f]" />
          <span>Refund the full payment</span>
        </label>
      )}
      <label className="mt-3 flex items-start gap-2.5 text-[15px]">
        <input type="checkbox" name="confirm" className="mt-1 h-4 w-4 accent-[#9a3b2f]" />
        <span>Yes, cancel order {number}</span>
      </label>
      {state.error && <p className="mt-3 text-[14px] font-medium text-sold">{state.error}</p>}
      <div className="mt-4 flex gap-3">
        <button type="submit" className={button.dangerSolid} disabled={pending}>
          {pending ? "Cancelling…" : "Cancel order"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={button.secondary}>
          Keep order
        </button>
      </div>
    </form>
  );
}

/** Deletes a finished, cancelled or unpaid order for good, after a confirmation. */
export function DeleteOrder({ number, blocked, paid }: { number: string; blocked: string | null; paid: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(deleteOrderAction, {});
  return (
    <Card title="Delete order">
      {blocked ? (
        <p className="text-[14px] text-soft">{blocked}</p>
      ) : !confirming ? (
        <>
          <p className="text-[14px] text-soft">Removes this order and everything linked to it. Use it to clear cancelled, unpaid or old orders.</p>
          <button type="button" className={`${button.danger} mt-3`} onClick={() => setConfirming(true)}>
            Delete order…
          </button>
        </>
      ) : (
        <div className="rounded-[4px] border border-sold/40 bg-[#fcf4f2] p-4">
          <p className="font-medium text-sold">Delete {number} for good?</p>
          <p className="mt-1 text-[14px] text-soft">
            The order, its {paid ? "payment record, " : ""}receipt, history and email log are all removed. This can&rsquo;t be undone.
            {paid ? " Its payment will no longer appear in Payments or the CSV, so download the CSV first if you need it for your records." : ""}
          </p>
          {state.error && <p className="mt-2 text-[14px] font-medium text-sold">{state.error}</p>}
          <div className="mt-3 flex gap-3">
            <form action={action}>
              <input type="hidden" name="number" value={number} />
              <button type="submit" disabled={pending} className={button.dangerSolid}>
                {pending ? "Deleting…" : "Yes, delete it"}
              </button>
            </form>
            <button type="button" className={button.secondary} onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
