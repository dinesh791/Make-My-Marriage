"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from "react";

type Album = { id: string; name: string; sortOrder: number };
type Photo = {
  id: string;
  albumId: string;
  caption: string;
  originalName: string;
  published: boolean;
  sizeBytes: number;
  createdAt: string | null;
  imageUrl: string;
};
type Gallery = { albums: Album[]; photos: Photo[] };
type StagedPhoto = { file: File; albumId: string; caption: string };
type ApiResult<T> = { success: true; data: T } | { success: false; error: { message: string } };
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 25 * 1024 * 1024;

async function jsonRequest<T>(url: string, method: string, body?: object): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result: ApiResult<T> = await response.json();
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export function GalleryManager({
  weddingId,
  initialGallery,
}: {
  weddingId: string;
  initialGallery: Gallery;
}) {
  const [gallery, setGallery] = useState(initialGallery);
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<StagedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photos = useMemo(
    () =>
      gallery.photos.filter(
        (photo) =>
          (activeAlbum === "all" || photo.albumId === activeAlbum) &&
          `${photo.caption} ${photo.originalName}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [gallery.photos, activeAlbum, search],
  );
  const preview = gallery.photos.find((photo) => photo.id === previewId);

  async function refresh() {
    setGallery(await jsonRequest<Gallery>(`/api/v1/weddings/${weddingId}/albums`, "GET"));
  }
  function stage(files: FileList | File[]) {
    const next = Array.from(files).map((file) => ({
      file,
      albumId: gallery.albums[0]?.id ?? "",
      caption: "",
    }));
    setSelectedFiles((current) => [...current, ...next].slice(0, 20));
  }
  function changeStaged(index: number, change: Partial<StagedPhoto>) {
    setSelectedFiles((current) =>
      current.map((item, position) => (position === index ? { ...item, ...change } : item)),
    );
  }
  async function upload() {
    if (!selectedFiles.length) return;
    setBusy(true);
    setMessage("");
    try {
      for (const [index, staged] of selectedFiles.entries()) {
        const { file, albumId, caption } = staged;
        if (!allowed.has(file.type) || file.size > maxSize || file.size === 0)
          throw new Error(`${file.name}: use a JPEG, PNG, or WebP under 25 MB.`);
        setMessage(`Uploading ${index + 1} of ${selectedFiles.length}: ${file.name}`);
        const { photoId, uploadUrl, contentType } = await jsonRequest<{
          photoId: string;
          uploadUrl: string;
          contentType: string;
        }>(`/api/v1/weddings/${weddingId}/photos/upload-init`, "POST", {
          albumId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          caption,
        });
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!put.ok)
          throw new Error(
            `Upload failed for ${file.name}. Check the R2 CORS settings and try again.`,
          );
        await jsonRequest(`/api/v1/weddings/${weddingId}/photos/upload-complete`, "POST", {
          photoId,
        });
        setSelectedFiles((current) => current.filter((item) => item !== staged));
      }
      await refresh();
      setUploadOpen(false);
      setSelectedFiles([]);
      setMessage(
        "Photos uploaded as drafts. Publish them when you are ready for guests to see them.",
      );
    } catch (error) {
      try {
        await refresh();
      } catch {
        // Keep the upload error visible if refreshing the gallery also fails.
      }
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  async function updatePhoto(photo: Photo, change: object) {
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest(`/api/v1/photos/${photo.id}`, "PATCH", change);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update photo.");
    } finally {
      setBusy(false);
    }
  }
  async function removePhoto(photo: Photo) {
    if (!window.confirm(`Delete ${photo.originalName}?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest(`/api/v1/photos/${photo.id}`, "DELETE");
      await refresh();
      setPreviewId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete photo.");
    } finally {
      setBusy(false);
    }
  }
  async function createAlbum(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest(`/api/v1/weddings/${weddingId}/albums`, "POST", { name });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add album.");
    } finally {
      setBusy(false);
    }
  }
  async function renameAlbum(album: Album) {
    const name = window.prompt("Album name", album.name)?.trim();
    if (!name || name === album.name) return;
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest(`/api/v1/albums/${album.id}`, "PATCH", { name });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not rename album.");
    } finally {
      setBusy(false);
    }
  }
  async function removeAlbum(album: Album) {
    if (!window.confirm(`Delete the ${album.name} album? It must be empty.`)) return;
    setBusy(true);
    setMessage("");
    try {
      await jsonRequest(`/api/v1/albums/${album.id}`, "DELETE");
      await refresh();
      if (activeAlbum === album.id) setActiveAlbum("all");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete album.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dashboard-main gallery-main">
      <div className="dashboard-page-heading gallery-heading">
        <div>
          <span className="dashboard-eyebrow">Wedding memories</span>
          <h1>Photo Gallery</h1>
          <p>
            Collect your photos, organize them by album, and publish the moments you want guests to
            see.
          </p>
        </div>
        <div className="gallery-heading-actions">
          <button type="button" className="button-secondary" onClick={() => setManageOpen(true)}>
            Manage albums
          </button>
          <button type="button" className="button-primary" onClick={() => setUploadOpen(true)}>
            Upload photos
          </button>
        </div>
      </div>
      <div className="gallery-summary">
        <div>
          <small>Total photos</small>
          <strong>{gallery.photos.length}</strong>
        </div>
        <div>
          <small>Published</small>
          <strong>{gallery.photos.filter((p) => p.published).length}</strong>
        </div>
        <div>
          <small>Drafts</small>
          <strong>{gallery.photos.filter((p) => !p.published).length}</strong>
        </div>
      </div>
      <div className="gallery-tabs" role="group" aria-label="Filter by album">
        <button
          type="button"
          className={activeAlbum === "all" ? "selected" : ""}
          onClick={() => setActiveAlbum("all")}
        >
          All photos ({gallery.photos.length})
        </button>
        {gallery.albums.map((album) => (
          <button
            type="button"
            key={album.id}
            className={activeAlbum === album.id ? "selected" : ""}
            onClick={() => setActiveAlbum(album.id)}
          >
            {album.name} ({gallery.photos.filter((p) => p.albumId === album.id).length})
          </button>
        ))}
      </div>
      {gallery.photos.length > 0 && (
        <label className="gallery-search">
          Search photos
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search caption or filename"
          />
        </label>
      )}
      {message && (
        <p className="gallery-message" role="status">
          {message}
        </p>
      )}
      {photos.length ? (
        <div className="gallery-grid-admin">
          {photos.map((photo) => (
            <article className="gallery-card" key={photo.id}>
              <button
                type="button"
                className="gallery-card-image"
                onClick={() => setPreviewId(photo.id)}
                aria-label={`Preview ${photo.caption || photo.originalName}`}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || photo.originalName}
                  loading="lazy"
                />
              </button>
              <div className="gallery-card-body">
                <span className={photo.published ? "gallery-status published" : "gallery-status"}>
                  {photo.published ? "Published" : "Draft"}
                </span>
                <h2>{photo.caption || photo.originalName}</h2>
                <small>{gallery.albums.find((a) => a.id === photo.albumId)?.name ?? "Album"}</small>
                <div className="gallery-card-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updatePhoto(photo, { published: !photo.published })}
                  >
                    {photo.published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" onClick={() => setPreviewId(photo.id)}>
                    Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <div className="gallery-empty-icon" aria-hidden="true">
            ▧
          </div>
          <span className="dashboard-eyebrow">Memories await</span>
          <h2>{gallery.photos.length ? "No photos in this view" : "No photos uploaded yet"}</h2>
          <p>
            {gallery.photos.length
              ? "Try another album or search term."
              : "Start with a few favourite wedding moments. Photos stay private until you publish them."}
          </p>
          <button type="button" className="button-primary" onClick={() => setUploadOpen(true)}>
            Upload your first photos
          </button>
        </div>
      )}
      {uploadOpen && (
        <div className="gallery-dialog-backdrop" role="presentation">
          <section
            className="gallery-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-upload-title"
          >
            <div className="gallery-dialog-heading">
              <div>
                <span className="dashboard-eyebrow">Wedding archive</span>
                <h2 id="gallery-upload-title">Upload wedding photos</h2>
              </div>
              <button
                type="button"
                aria-label="Close upload"
                onClick={() => setUploadOpen(false)}
                disabled={busy}
              >
                ×
              </button>
            </div>
            <div className="gallery-dialog-content">
              <div
                className="gallery-drop"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  stage(event.dataTransfer.files);
                }}
              >
                <strong>Drag photos here or browse files</strong>
                <p>JPEG, PNG, or WebP · up to 25 MB per photo</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => stage(event.target.files ?? [])}
                />
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </button>
              </div>
              <p>
                {selectedFiles.length
                  ? `${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"} selected`
                  : "No files selected"}
              </p>
              <div className="gallery-staged-list">
                {selectedFiles.map((item, index) => (
                  <div className="gallery-staged" key={`${item.file.name}-${index}`}>
                    <div>
                      <strong>{item.file.name}</strong>
                      <small>{(item.file.size / 1024 / 1024).toFixed(1)} MB</small>
                    </div>
                    <label>
                      Album
                      <select
                        value={item.albumId}
                        onChange={(event) => changeStaged(index, { albumId: event.target.value })}
                      >
                        {gallery.albums.map((album) => (
                          <option key={album.id} value={album.id}>
                            {album.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Caption
                      <input
                        value={item.caption}
                        maxLength={240}
                        onChange={(event) => changeStaged(index, { caption: event.target.value })}
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() =>
                        setSelectedFiles((current) =>
                          current.filter((_, position) => position !== index),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {message && <p role="status">{message}</p>}
            </div>
            <div className="gallery-dialog-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setUploadOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={upload}
                disabled={busy || !selectedFiles.length}
              >
                {busy ? "Uploading…" : `Upload ${selectedFiles.length || ""} photos`}
              </button>
            </div>
          </section>
        </div>
      )}
      {manageOpen && (
        <div className="gallery-dialog-backdrop" role="presentation">
          <section
            className="gallery-dialog gallery-small-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-albums-title"
          >
            <div className="gallery-dialog-heading">
              <h2 id="gallery-albums-title">Manage albums</h2>
              <button type="button" aria-label="Close albums" onClick={() => setManageOpen(false)}>
                ×
              </button>
            </div>
            <div className="gallery-dialog-content">
              <form action={createAlbum} className="gallery-add-album">
                <input name="name" placeholder="New album name" maxLength={80} required />
                <button className="button-primary" disabled={busy}>
                  Add album
                </button>
              </form>
              <ul className="gallery-album-list">
                {gallery.albums.map((album) => (
                  <li key={album.id}>
                    <span>{album.name}</span>
                    <button type="button" disabled={busy} onClick={() => renameAlbum(album)}>
                      Rename
                    </button>
                    <button type="button" disabled={busy} onClick={() => removeAlbum(album)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              {message && <p role="status">{message}</p>}
            </div>
          </section>
        </div>
      )}
      {preview && (
        <div className="gallery-dialog-backdrop" role="presentation">
          <section
            className="gallery-dialog gallery-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-preview-title"
          >
            <div className="gallery-dialog-heading">
              <h2 id="gallery-preview-title">Photo details</h2>
              <button type="button" aria-label="Close preview" onClick={() => setPreviewId(null)}>
                ×
              </button>
            </div>
            <img src={preview.imageUrl} alt={preview.caption || preview.originalName} />
            <div className="gallery-dialog-content">
              <p>{preview.originalName}</p>
              <label>
                Caption
                <input
                  key={preview.id}
                  defaultValue={preview.caption}
                  maxLength={240}
                  id="gallery-caption"
                />
              </label>
              <label>
                Album
                <select key={preview.id} defaultValue={preview.albumId} id="gallery-album">
                  {gallery.albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="gallery-dialog-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    updatePhoto(preview, {
                      caption: (document.getElementById("gallery-caption") as HTMLInputElement)
                        .value,
                      albumId: (document.getElementById("gallery-album") as HTMLSelectElement)
                        .value,
                    })
                  }
                >
                  Save details
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updatePhoto(preview, { published: !preview.published })}
                >
                  {preview.published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" disabled={busy} onClick={() => removePhoto(preview)}>
                  Delete photo
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
