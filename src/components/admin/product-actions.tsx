"use client";

import { useState } from "react";
import { deleteProductAction, duplicateProductAction } from "@/app/admin/(console)/products/actions";
import { SubmitButton } from "./submit-button";
import { Card, button } from "./ui";

export function ProductActions({ id, name, orderCount }: { id: string; name: string; orderCount: number }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Card title="More actions">
      <div className="flex flex-wrap items-start gap-3">
        <form action={duplicateProductAction}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton pending="Copying…" className={button.secondary}>
            Duplicate as draft
          </SubmitButton>
        </form>
        {!confirming ? (
          <button type="button" className={button.danger} onClick={() => setConfirming(true)}>
            Delete product…
          </button>
        ) : (
          <div className="w-full rounded-[4px] border border-sold/40 bg-[#fcf4f2] p-4">
            <p className="font-medium text-sold">Delete &ldquo;{name}&rdquo; for good?</p>
            <p className="mt-1 text-[14px] text-soft">
              {orderCount
                ? `It appears in ${orderCount} past ${orderCount === 1 ? "order" : "orders"}; those orders keep their own copy of the details. `
                : ""}
              This can&rsquo;t be undone. To take it off sale but keep it, set it to Draft instead.
            </p>
            <div className="mt-3 flex gap-3">
              <form action={deleteProductAction}>
                <input type="hidden" name="id" value={id} />
                <SubmitButton pending="Deleting…" className={button.dangerSolid}>
                  Yes, delete it
                </SubmitButton>
              </form>
              <button type="button" className={button.secondary} onClick={() => setConfirming(false)}>
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
