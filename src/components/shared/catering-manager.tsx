"use client";
import { useState, type FormEvent } from "react";
import type { CateringInput } from "@/modules/catering/catering.validators";
const meals = ["breakfast", "lunch", "dinner", "snacks"] as const;
const empty: CateringInput = {
  foodType: "",
  breakfast: "",
  lunch: "",
  dinner: "",
  snacks: "",
  notes: "",
  catererName: "",
  contactPerson: "",
  phone: "",
  email: "",
};
const foodLabels = {
  VEGETARIAN: "Vegetarian",
  NON_VEGETARIAN: "Non-vegetarian",
  MIXED: "Mixed",
  "": "",
};
export function CateringManager({
  weddingId,
  initial,
}: {
  weddingId: string;
  initial: CateringInput | null;
}) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial ?? empty);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  function edit() {
    setDraft(saved ?? empty);
    setMessage("");
    setEditing(true);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/weddings/${weddingId}/catering`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error?.message ?? "Could not save catering.");
      setSaved(result.data.catering);
      setEditing(false);
      setMessage("Menu saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not reach the server. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="catering-workspace">
      <header className="catering-heading">
        <div>
          <h1>{editing ? "Edit catering menu" : "Catering"}</h1>
          <p>Your wedding menu</p>
        </div>
        {!editing && saved && (
          <button className="button-primary" onClick={edit}>
            Edit menu
          </button>
        )}
      </header>
      {message && <p role="status">{message}</p>}
      {editing ? (
        <form onSubmit={save} className="catering-editor">
          <label>
            Food type
            <select
              value={draft.foodType}
              disabled={busy}
              onChange={(e) =>
                setDraft({ ...draft, foodType: e.target.value as CateringInput["foodType"] })
              }
            >
              <option value="">Choose food type (optional)</option>
              {["VEGETARIAN", "NON_VEGETARIAN", "MIXED"].map((key) => (
                <option key={key} value={key}>
                  {foodLabels[key as keyof typeof foodLabels]}
                </option>
              ))}
            </select>
          </label>
          <div className="catering-grid">
            {meals.map((meal) => (
              <label key={meal}>
                <span className="catering-meal-title">{meal}</span>
                <textarea
                  rows={5}
                  maxLength={2000}
                  disabled={busy}
                  value={draft[meal]}
                  placeholder="One dish per line"
                  onChange={(e) => setDraft({ ...draft, [meal]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label>
            Special notes (optional)
            <textarea
              rows={3}
              maxLength={2000}
              disabled={busy}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
          <details>
            <summary>Caterer contact (optional)</summary>
            <div className="catering-grid">
              {(
                [
                  ["catererName", "Caterer name"],
                  ["contactPerson", "Contact person"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    disabled={busy}
                    type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                    maxLength={key === "phone" ? 30 : key === "email" ? 254 : 120}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </details>
          <div className="catering-actions">
            <button
              type="button"
              className="button-secondary"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setMessage("");
              }}
            >
              Cancel
            </button>
            <button className="button-primary" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : !saved ? (
        <div className="catering-empty">
          <h2>No catering details added yet</h2>
          <p>Keep your wedding meals and special requests together.</p>
          <button className="button-primary" onClick={edit}>
            Add catering details
          </button>
        </div>
      ) : (
        <>
          {saved.foodType && <p className="catering-food-badge">{foodLabels[saved.foodType]}</p>}
          <div className="catering-grid">
            {meals.map((meal) => {
              const dishes = saved[meal]
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <article className="catering-card" key={meal}>
                  <h2 className="catering-meal-title">{meal}</h2>
                  {dishes.length ? (
                    <ul>
                      {dishes.slice(0, 4).map((dish, index) => (
                        <li key={index}>{dish}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No dishes added yet.</p>
                  )}
                  {dishes.length > 4 && (
                    <details>
                      <summary>View all ({dishes.length})</summary>
                      <ul>
                        {dishes.slice(4).map((dish, index) => (
                          <li key={index}>{dish}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              );
            })}
          </div>
          {saved.notes && (
            <details className="catering-notes">
              <summary>Special notes</summary>
              <p>{saved.notes}</p>
            </details>
          )}
        </>
      )}
    </section>
  );
}
