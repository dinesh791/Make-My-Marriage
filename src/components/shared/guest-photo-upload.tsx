"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

type Album = { id: string; name: string };
type ApiResult<T> = { success: true; data: T } | { success: false; error: { message: string } };
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 25 * 1024 * 1024;

async function postJson<T>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result: ApiResult<T> = await response.json();
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export function GuestPhotoUpload({ slug, albums }: { slug: string; albums: Album[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ file: File; previewUrl: string } | null>(null);
  const [albumId, setAlbumId] = useState(albums[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selected) return;
    return () => URL.revokeObjectURL(selected.previewUrl);
  }, [selected]);

  function close() {
    setOpen(false);
    setSelected(null);
    setCaption("");
    setMessage("");
  }

  async function upload() {
    const file = selected?.file;
    if (!file || !albumId || busy) return;
    if (!allowed.has(file.type) || file.size === 0 || file.size > maxSize) {
      setMessage("Choose a JPEG, PNG, or WebP photo under 25 MB.");
      return;
    }
    setBusy(true);
    setMessage("Preparing your photo…");
    try {
      const endpoint = `/api/v1/public/weddings/${encodeURIComponent(slug)}/photos`;
      const { photoId, uploadUrl, contentType } = await postJson<{
        photoId: string;
        uploadUrl: string;
        contentType: string;
      }>(`${endpoint}/upload-init`, {
        albumId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        caption,
      });
      setMessage("Uploading your photo…");
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed. Please try again.");
      await postJson(`${endpoint}/upload-complete`, { photoId });
      setSelected(null);
      setCaption("");
      setOpen(false);
      setMessage("Photo sent to the couple for review. It will appear here after they publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {albums.length ? (
        <button
          className="wedding-button guest-upload-button"
          type="button"
          onClick={() => setOpen(true)}
        >
          Share a photo
        </button>
      ) : (
        <p>The couple will make photo albums available soon.</p>
      )}
      {message && !open && (
        <p className="guest-upload-message" role="status">
          {message}
        </p>
      )}
      {open && (
        <div className="gallery-dialog-backdrop" role="presentation">
          <section
            className="gallery-dialog gallery-small-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-upload-title"
          >
            <div className="gallery-dialog-heading">
              <div>
                <span className="wedding-eyebrow">Share a memory</span>
                <h2 id="guest-upload-title">Add a wedding photo</h2>
              </div>
              <button type="button" aria-label="Close upload" disabled={busy} onClick={close}>
                ×
              </button>
            </div>
            <div className="gallery-dialog-content">
              <p>Your photo stays private until the couple approves and publishes it.</p>
              <label>
                Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const next = event.target.files?.[0];
                    setSelected(
                      next ? { file: next, previewUrl: URL.createObjectURL(next) } : null,
                    );
                    setMessage("");
                  }}
                />
              </label>
              {selected && (
                <img
                  className="guest-upload-preview"
                  src={selected.previewUrl}
                  alt="Selected photo preview"
                />
              )}
              <p>JPEG, PNG, or WebP · maximum 25 MB</p>
              <label>
                Album
                <select value={albumId} onChange={(event) => setAlbumId(event.target.value)}>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Caption (optional)
                <input
                  value={caption}
                  maxLength={240}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </label>
              {message && <p role="status">{message}</p>}
            </div>
            <div className="gallery-dialog-actions">
              <button className="button-secondary" type="button" disabled={busy} onClick={close}>
                Cancel
              </button>
              <button
                className="button-primary"
                type="button"
                disabled={busy || !selected || !albumId}
                onClick={upload}
              >
                {busy ? "Uploading…" : "Send photo for review"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
