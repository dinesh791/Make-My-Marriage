"use client";
import { useState, type FormEvent } from "react";
import type { CateringInput } from "@/modules/catering/catering.validators";
const meals = ["breakfast", "lunch", "dinner", "snacks"] as const;
const maxMealLength = 2000;
type Meal = (typeof meals)[number];
const suggestions: Record<Meal, { vegetarian: string[]; nonVegetarian: string[] }> = {
  breakfast: {
    vegetarian: ["Idli", "Pongal", "Vada", "Dosa", "Poori", "Upma"],
    nonVegetarian: ["Egg dosa", "Omelette", "Chicken salna"],
  },
  lunch: {
    vegetarian: [
      "Sambar rice",
      "Rasam rice",
      "Curd rice",
      "Vegetable biryani",
      "Poriyal",
      "Payasam",
    ],
    nonVegetarian: ["Chicken biryani", "Mutton biryani", "Fish curry", "Chicken curry"],
  },
  dinner: {
    vegetarian: ["Chapati", "Parotta", "Dosa", "Idiyappam", "Paneer curry"],
    nonVegetarian: ["Chicken curry", "Mutton curry", "Egg curry", "Fish fry"],
  },
  snacks: {
    vegetarian: ["Sundal", "Bajji", "Bonda", "Murukku", "Kesari"],
    nonVegetarian: ["Chicken 65", "Fish fry", "Egg puff"],
  },
};
const dishesOf = (value: string) =>
  value
    .split(/\r?\n/)
    .map((dish) => dish.trim())
    .filter(Boolean);
function ActionIcon({ kind }: { kind: "add" | "edit" | "delete" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "add" ? (
        <path d="M12 5v14M5 12h14" />
      ) : kind === "edit" ? (
        <>
          <path d="M4 20h4l11-11-4-4L4 16v4Z" />
          <path d="m13 7 4 4" />
        </>
      ) : (
        <>
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6" />
        </>
      )}
    </svg>
  );
}
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
  const [selected, setSelected] = useState<Record<Meal, string>>({
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
  });
  const [custom, setCustom] = useState<Record<Meal, string>>({
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
  });
  const [renaming, setRenaming] = useState<{ meal: Meal; index: number } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  function setDishes(meal: Meal, dishes: string[]) {
    const value = dishes.join("\n");
    if (value.length > maxMealLength) {
      setMessage(`The ${meal} menu is full. Remove a dish or use a shorter name.`);
      return false;
    }
    setDraft((current) => ({ ...current, [meal]: value }));
    setMessage("");
    return true;
  }
  function addCustom(meal: Meal, dishes: string[]) {
    const name = custom[meal].trim();
    if (!name) return;
    if (dishes.some((dish) => dish.toLowerCase() === name.toLowerCase())) {
      setMessage(`${name} is already in ${meal}.`);
      return;
    }
    if (setDishes(meal, [...dishes, name])) setCustom((current) => ({ ...current, [meal]: "" }));
  }
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
          <button
            className="button-primary catering-icon-label"
            onClick={edit}
            aria-label="Edit catering menu"
          >
            <ActionIcon kind="edit" />
            <span>Edit menu</span>
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
              onChange={(e) => {
                setDraft({ ...draft, foodType: e.target.value as CateringInput["foodType"] });
                setSelected({ breakfast: "", lunch: "", dinner: "", snacks: "" });
              }}
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
            {meals.map((meal) => {
              const dishes = dishesOf(draft[meal]);
              const choices =
                draft.foodType === "VEGETARIAN"
                  ? suggestions[meal].vegetarian
                  : draft.foodType === "NON_VEGETARIAN"
                    ? suggestions[meal].nonVegetarian
                    : [...suggestions[meal].vegetarian, ...suggestions[meal].nonVegetarian];
              return (
                <fieldset className="catering-meal-editor" key={meal} disabled={busy}>
                  <legend className="catering-meal-title">{meal}</legend>
                  <div className="catering-add-row">
                    <select
                      aria-label={`Suggested ${meal} dish`}
                      value={selected[meal]}
                      onChange={(e) => setSelected({ ...selected, [meal]: e.target.value })}
                    >
                      <option value="">Choose a dish</option>
                      {choices
                        .filter(
                          (dish) =>
                            !dishes.some((item) => item.toLowerCase() === dish.toLowerCase()),
                        )
                        .map((dish) => (
                          <option key={dish} value={dish}>
                            {dish}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="catering-icon-button"
                      aria-label={`Add selected ${meal} dish`}
                      disabled={!selected[meal]}
                      onClick={() => {
                        if (setDishes(meal, [...dishes, selected[meal]]))
                          setSelected({ ...selected, [meal]: "" });
                      }}
                    >
                      <ActionIcon kind="add" />
                    </button>
                  </div>
                  <div className="catering-add-row">
                    <input
                      aria-label={`Custom ${meal} dish`}
                      maxLength={120}
                      placeholder="Add your own dish"
                      value={custom[meal]}
                      onChange={(e) => setCustom({ ...custom, [meal]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustom(meal, dishes);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="catering-icon-button"
                      aria-label={`Add custom ${meal} dish`}
                      disabled={!custom[meal].trim()}
                      onClick={() => addCustom(meal, dishes)}
                    >
                      <ActionIcon kind="add" />
                    </button>
                  </div>
                  <ul className="catering-dish-list">
                    {dishes.map((dish, index) => (
                      <li key={index}>
                        {renaming?.meal === meal && renaming.index === index ? (
                          <input
                            aria-label={`Edit ${dish}`}
                            maxLength={120}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => {
                              const next = renameValue.trim();
                              if (
                                next &&
                                setDishes(
                                  meal,
                                  dishes.map((item, position) =>
                                    position === index ? next : item,
                                  ),
                                )
                              )
                                setRenaming(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span>{dish}</span>
                        )}
                        <button
                          type="button"
                          className="catering-icon-button"
                          aria-label={`Edit ${dish}`}
                          onClick={() => {
                            setRenameValue(dish);
                            setRenaming({ meal, index });
                          }}
                        >
                          <ActionIcon kind="edit" />
                        </button>
                        <button
                          type="button"
                          className="catering-icon-button"
                          aria-label={`Delete ${dish}`}
                          onClick={() =>
                            setDishes(
                              meal,
                              dishes.filter((_, position) => position !== index),
                            )
                          }
                        >
                          <ActionIcon kind="delete" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              );
            })}
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
              {busy ? (
                <>
                  <span className="catering-spinner small" aria-hidden="true" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      ) : !saved ? (
        <div className="catering-empty">
          <h2>No catering details added yet</h2>
          <p>Keep your wedding meals and special requests together.</p>
          <button className="button-primary catering-icon-label" onClick={edit}>
            <ActionIcon kind="add" />
            <span>Add catering details</span>
          </button>
        </div>
      ) : (
        <>
          {saved.foodType && <p className="catering-food-badge">{foodLabels[saved.foodType]}</p>}
          <div className="catering-grid">
            {meals.map((meal) => {
              const dishes = dishesOf(saved[meal]);
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
