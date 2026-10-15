import type { WeddingDto } from "@/modules/wedding/wedding.dto";

function weddingDateForInput(isoDate: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoDate));
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function weddingDetailsFromForm(form: FormData) {
  return {
    title: form.get("title"),
    brideName: form.get("brideName"),
    groomName: form.get("groomName"),
    weddingDate: new Date(`${form.get("weddingDate")}T00:00:00+05:30`).toISOString(),
    venueName: form.get("venueName"),
    venueAddress: form.get("venueAddress"),
    story: form.get("story"),
    mapsUrl: form.get("mapsUrl"),
  };
}

export function WeddingDetailsFields({ wedding }: { wedding?: WeddingDto }) {
  return (
    <>
      <div className="setup-grid">
        <div>
          <label className="field-label" htmlFor="brideName">
            Bride&apos;s name (optional)
          </label>
          <input
            className="field"
            id="brideName"
            name="brideName"
            maxLength={100}
            defaultValue={wedding?.brideName ?? ""}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="groomName">
            Groom&apos;s name (optional)
          </label>
          <input
            className="field"
            id="groomName"
            name="groomName"
            maxLength={100}
            defaultValue={wedding?.groomName ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="title">
          Wedding title
        </label>
        <input
          className="field"
          id="title"
          name="title"
          placeholder="e.g. Dinesh & Usha Wedding"
          maxLength={120}
          minLength={3}
          defaultValue={wedding?.title ?? ""}
          required
        />
      </div>
      <div className="setup-grid">
        <div>
          <label className="field-label" htmlFor="weddingDate">
            Wedding date
          </label>
          <input
            className="field"
            id="weddingDate"
            name="weddingDate"
            type="date"
            defaultValue={wedding ? weddingDateForInput(wedding.weddingDate) : ""}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="venueName">
            Venue name
          </label>
          <input
            className="field"
            id="venueName"
            name="venueName"
            maxLength={160}
            minLength={2}
            defaultValue={wedding?.venueName ?? ""}
            required
          />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="venueAddress">
          Venue address
        </label>
        <input
          className="field"
          id="venueAddress"
          name="venueAddress"
          placeholder="Town or full address"
          maxLength={500}
          minLength={2}
          defaultValue={wedding?.venueAddress ?? ""}
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="story">
          A short story (optional)
        </label>
        <textarea
          className="field setup-textarea"
          id="story"
          name="story"
          rows={3}
          maxLength={2000}
          defaultValue={wedding?.story ?? ""}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="mapsUrl">
          Google Maps link (optional)
        </label>
        <input
          className="field"
          id="mapsUrl"
          name="mapsUrl"
          type="url"
          placeholder="https://maps.google.com/..."
          maxLength={2000}
          defaultValue={wedding?.mapsUrl ?? ""}
        />
      </div>
    </>
  );
}
