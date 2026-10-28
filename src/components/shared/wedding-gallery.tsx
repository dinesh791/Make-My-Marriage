"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

type Album = { id: string; name: string };
type Photo = {
  id: string;
  albumId: string;
  caption: string;
  originalName: string;
  imageUrl: string;
};

export function WeddingGallery({ albums, photos }: { albums: Album[]; photos: Photo[] }) {
  const [albumId, setAlbumId] = useState("all");
  const [selected, setSelected] = useState<Photo | null>(null);
  const visible = albumId === "all" ? photos : photos.filter((photo) => photo.albumId === albumId);
  if (!photos.length) return null;
  return (
    <section className="wedding-section live-gallery-section" id="gallery">
      <div className="wedding-content">
        <div className="wedding-section-heading">
          <span className="wedding-eyebrow">✦ Cherished moments ✦</span>
          <h2 className="wedding-serif">Photo Gallery</h2>
          <p>Memories shared by the couple.</p>
        </div>
        <div className="gallery-tabs" role="group" aria-label="Filter photos">
          <button
            className={albumId === "all" ? "selected" : ""}
            type="button"
            onClick={() => setAlbumId("all")}
          >
            All photos
          </button>
          {albums.map((album) => (
            <button
              key={album.id}
              className={albumId === album.id ? "selected" : ""}
              type="button"
              onClick={() => setAlbumId(album.id)}
            >
              {album.name}
            </button>
          ))}
        </div>
        <div className="live-gallery-grid">
          {visible.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(photo)}
              aria-label={`View ${photo.caption || photo.originalName}`}
            >
              <img src={photo.imageUrl} alt={photo.caption || photo.originalName} loading="lazy" />
              <span>
                {photo.caption || albums.find((album) => album.id === photo.albumId)?.name}
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="gallery-dialog-backdrop" role="presentation">
            <section
              className="gallery-dialog gallery-preview"
              role="dialog"
              aria-modal="true"
              aria-label="Wedding photo preview"
            >
              <div className="gallery-dialog-heading">
                <h2>{selected.caption || "Wedding photo"}</h2>
                <button type="button" aria-label="Close photo" onClick={() => setSelected(null)}>
                  ×
                </button>
              </div>
              <img src={selected.imageUrl} alt={selected.caption || selected.originalName} />
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
