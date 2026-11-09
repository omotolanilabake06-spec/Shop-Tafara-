"use client";

import { useState } from "react";
import { deletePostAction } from "@/app/admin/(console)/journal/actions";
import { SubmitButton } from "./submit-button";
import { Card, button } from "./ui";

export function JournalActions({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Card title="More actions">
      {!confirming ? (
        <button type="button" className={button.danger} onClick={() => setConfirming(true)}>
          Delete story…
        </button>
      ) : (
        <div className="rounded-[4px] border border-sold/40 bg-[#fcf4f2] p-4">
          <p className="font-medium text-sold">Delete &ldquo;{title}&rdquo; for good?</p>
          <p className="mt-1 text-[14px] text-soft">This can&rsquo;t be undone. To take it off the site but keep it, set it to Draft instead.</p>
          <div className="mt-3 flex gap-3">
            <form action={deletePostAction}>
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
    </Card>
  );
}
