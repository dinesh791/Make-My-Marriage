"use client";

import { useState } from "react";

export function CopyWeddingLinkButton({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    try {
      const url = new URL(`/w/${slug}`, window.location.origin);
      await navigator.clipboard.writeText(url.href);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <button type="button" onClick={copyLink}>
      <span aria-live="polite">
        {status === "copied" ? "Wedding link copied" : "Share wedding link"}
        {status === "failed" && <small>Copy failed. Open your website to copy its URL.</small>}
      </span>
      <span aria-hidden="true">{status === "copied" ? "✓" : "⧉"}</span>
    </button>
  );
}
