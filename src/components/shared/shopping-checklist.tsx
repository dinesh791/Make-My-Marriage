"use client";

import { useState, type FormEvent } from "react";
import type { ShoppingItemDto } from "@/modules/shopping/shopping.dto";
import type { ShoppingCategory } from "@/models/shopping-item";

const categories: Array<{ key: ShoppingCategory; label: string }> = [
  { key: "BRIDE", label: "Bride" },
  { key: "GROOM", label: "Groom" },
  { key: "WEDDING", label: "Wedding" },
];

type Editor = { mode: "add" | "edit"; item?: ShoppingItemDto } | null;

export function ShoppingChecklist({
  weddingId,
  initialItems,
}: {
  weddingId: string;
  initialItems: ShoppingItemDto[];
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<ShoppingCategory | "ALL">("ALL");
  const [editor, setEditor] = useState<Editor>(null);
  const [deleting, setDeleting] = useState<ShoppingItemDto | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const completed = items.filter((item) => item.completed).length;
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0;

  async function send(url: string, method: string, body?: object) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => null);
    if (!result) throw new Error("The server returned an unexpected response.");
    if (!response.ok || !result.success)
      throw new Error(result.error?.message ?? "Please try again.");
    return result.data;
  }

  async function toggle(item: ShoppingItemDto) {
    if (pendingId) return;
    setPendingId(item.id);
    setMessage("");
    try {
      const data = await send(`/api/v1/shopping-items/${item.id}`, "PATCH", {
        completed: !item.completed,
      });
      setItems((current) => current.map((entry) => (entry.id === item.id ? data.item : entry)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update this item.");
    } finally {
      setPendingId(null);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !editor) return;
    const fields = new FormData(event.currentTarget);
    const title = String(fields.get("title") ?? "").trim();
    const category = String(fields.get("category") ?? "") as ShoppingCategory;
    if (!title) {
      setMessage("Enter an item name.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const data =
        editor.mode === "add"
          ? await send(`/api/v1/weddings/${weddingId}/shopping-items`, "POST", { title, category })
          : await send(`/api/v1/shopping-items/${editor.item!.id}`, "PATCH", { title, category });
      setItems((current) =>
        editor.mode === "add"
          ? [...current, data.item]
          : current.map((item) => (item.id === data.item.id ? data.item : item)),
      );
      setEditor(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this item.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!deleting || pending) return;
    setPending(true);
    setMessage("");
    try {
      await send(`/api/v1/shopping-items/${deleting.id}`, "DELETE");
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete this item.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shopping-workspace">
      <div className="shopping-heading">
        <div>
          <span className="eyebrow">Your wedding workspace</span>
          <h1>Shopping checklist</h1>
          <p>
            Keep Bride, Groom, and Wedding essentials together. You and your partner can update this
            list.
          </p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => {
            setMessage("");
            setEditor({ mode: "add" });
          }}
        >
          + Add item
        </button>
      </div>
      <section className="shopping-progress" aria-label="Checklist progress">
        <div>
          <span className="eyebrow">Wedding preparations</span>
          <h2>
            {completed} of {items.length} completed
          </h2>
        </div>
        <strong>{percent}%</strong>
        <progress value={completed} max={Math.max(items.length, 1)}>
          {percent}%
        </progress>
        <div className="shopping-progress-categories">
          {categories.map(({ key, label }) => (
            <span key={key}>
              {label}: {items.filter((item) => item.category === key && item.completed).length} of{" "}
              {items.filter((item) => item.category === key).length}
            </span>
          ))}
        </div>
      </section>
      <div className="shopping-tabs" role="group" aria-label="Filter shopping items">
        <button
          type="button"
          className={filter === "ALL" ? "active" : ""}
          aria-pressed={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        >
          All items ({items.length})
        </button>
        {categories.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? "active" : ""}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label} ({items.filter((item) => item.category === key).length})
          </button>
        ))}
      </div>
      {message && !editor && !deleting && (
        <p className="shopping-error" role="alert">
          {message}
        </p>
      )}
      {categories
        .filter(({ key }) => filter === "ALL" || filter === key)
        .map(({ key, label }) => {
          const categoryItems = items
            .filter((item) => item.category === key)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
          return (
            <section className="shopping-section" key={key} aria-label={`${label} items`}>
              <div className="shopping-section-heading">
                <h2>{label} essentials</h2>
                <span>
                  {categoryItems.filter((item) => item.completed).length} of {categoryItems.length}{" "}
                  completed
                </span>
              </div>
              {categoryItems.length ? (
                <ul className="shopping-items">
                  {categoryItems.map((item) => (
                    <li key={item.id} className={item.completed ? "completed" : ""}>
                      <label className="shopping-check">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          disabled={pendingId === item.id}
                          onChange={() => toggle(item)}
                        />
                        <span>{item.title}</span>
                      </label>
                      <div className="shopping-item-actions">
                        <button
                          type="button"
                          aria-label={`Edit ${item.title}`}
                          title={`Edit ${item.title}`}
                          onClick={() => {
                            setMessage("");
                            setEditor({ mode: "edit", item });
                          }}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4L16.5 3.5Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.title}`}
                          title={`Delete ${item.title}`}
                          onClick={() => {
                            setMessage("");
                            setDeleting(item);
                          }}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="shopping-empty">
                  No {label.toLowerCase()} items yet. Add one when you are ready.
                </p>
              )}
            </section>
          );
        })}
      {editor && (
        <div
          className="shopping-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) setEditor(null);
          }}
        >
          <div
            className="shopping-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-dialog-title"
          >
            <h2 id="shopping-dialog-title">
              {editor.mode === "add" ? "Add shopping item" : "Edit shopping item"}
            </h2>
            <p>Both partners can manage this checklist.</p>
            <form onSubmit={save}>
              <label htmlFor="shopping-title">Item name</label>
              <input
                id="shopping-title"
                name="title"
                maxLength={120}
                required
                autoFocus
                defaultValue={editor.item?.title ?? ""}
              />
              <label htmlFor="shopping-category">Category</label>
              <select
                id="shopping-category"
                name="category"
                defaultValue={editor.item?.category ?? (filter === "ALL" ? "BRIDE" : filter)}
              >
                {categories.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              {message && (
                <p className="shopping-error" role="alert">
                  {message}
                </p>
              )}
              <div className="shopping-dialog-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setEditor(null)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button type="submit" className="button" disabled={pending}>
                  {pending ? "Saving…" : "Save item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleting && (
        <div className="shopping-dialog-backdrop" role="presentation">
          <div
            className="shopping-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="shopping-delete-title"
            aria-describedby="shopping-delete-description"
          >
            <h2 id="shopping-delete-title">Delete this item?</h2>
            <p id="shopping-delete-description">
              {deleting.title} will be removed from your shared checklist.
            </p>
            {message && (
              <p className="shopping-error" role="alert">
                {message}
              </p>
            )}
            <div className="shopping-dialog-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setDeleting(null)}
                disabled={pending}
              >
                Cancel
              </button>
              <button type="button" className="button" onClick={remove} disabled={pending}>
                {pending ? "Deleting…" : "Delete item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
