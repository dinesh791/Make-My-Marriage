import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { WeddingCountdown } from "@/components/shared/wedding-countdown";

const events = [
  {
    name: "Engagement",
    date: "Friday, 08 January 2027",
    time: "6:00 PM",
    note: "An evening of family blessings",
  },
  {
    name: "Nalangu",
    date: "Monday, 18 January 2027",
    time: "4:30–8:00 PM",
    note: "Traditional rituals, laughter, and turmeric blessings",
  },
  {
    name: "Muhurtham",
    date: "Wednesday, 20 January 2027",
    time: "6:00–7:30 AM",
    note: "The sacred wedding ceremony",
  },
  {
    name: "Reception",
    date: "Wednesday, 20 January 2027",
    time: "6:00 PM",
    note: "Dinner and celebration with family and friends",
  },
];

const gallery = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDsPqHKtn2NDP_LtGwuTFuGIxhYnNlSiKM9mMae4Z9Wr1C8zL1itB5knpLFDzJMekHfvU7nYE_nQR4PhCfKKtX_T0X0kb8hJrCmP4MeY5p3OEAZOwr7uK7cI81CZdmRLHYe_kpDoM1sfxrw0YZd0FQ-NL7zyDdXU4fTDJJy4mOd_N3M-nEakrS5otFDmOxFkDYL12vFyJP2DyOtueNwr1b6hA8XHyaJ8h3HSKh27Nl6",
    alt: "A Tamil wedding ceremony beneath a flower-decorated mandapam",
    title: "Muhurtham Mandapam",
    subtitle: "Temple mandapam and sacred fire",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBF7IogXfedwD64zA50uy0-awRCx8EhX_9-DTWsefnNnJA9Kdn6NTRGkqDBiB7bMxIpLyAT-sO_461d7ndLaKGgq2IuW7YjLX-Wa5WvR0dzvMLRpP-wjc4BCNA3lz67jiH_CrOol1cKaCUuHO67MQ7Tnn5YV7xQeiVMmNxWQsUR3DtPEQCFaJkvxrYzIQpL1-XqSZyILo1xca8EI1lmUdBJJIFwvyf1BIGDe0OWdloj",
    alt: "A warm, traditional Nalangu celebration with turmeric and brass lamps",
    title: "Nalangu Celebrations",
    subtitle: "Golden turmeric blessings",
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmdc1zzkrfXOcDKTVl61zAJHmoqT1YCx5J1jl4s3b32C-b_ZY-2waSXWlOeAGePg_OVbs6P1xvyygcrw6mgkJ8XZdiCHmZo-9qv8f2mRbXo6TqlUP1Yk2slBgc2sM7LDFMTdmHTEFfFBNRRqa-zS6WAtheGRFoFKlHmLdM062z-EEi1Ma1CvQSb_7utij8WMHVT1lf4T7huu2AZ8toDpUoT13I7i-0RM7VHGan8clx",
    alt: "Traditional temple jewellery, crimson silk, and jasmine flowers",
    title: "Heirloom Details",
    subtitle: "Silk saree and bridal adornments",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="wedding-section-heading">
      <span className="wedding-eyebrow">✦ {eyebrow} ✦</span>
      <h2 className="wedding-serif">{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function PublicWeddingSite({
  slug,
  homeHref = `/w/${slug}`,
  welcomeHero = false,
}: {
  slug: string;
  homeHref?: string;
  welcomeHero?: boolean;
}) {
  const mapImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDnPm93r7H1nFLwLmEpoc7Bt9B3I2SUTH_Puvs_3yHV18Jgle-oTihd6QmEu9O5fzotA9EW1zKKG5J3XOAXJPYONzRPKdsypqsopk6mv0U6oZfI5zsXMyAGYQHHSvCmzRm0CPbaIeTdbM0YocNxk1kZFUk3U3NAOTTZPd3Wc2ZRcFehqvYmJrkZralO48rpRLMTRRtSWOfxRI2KhfEJ2A5BqxZw5zjkpK12ycz3yIWd";
  const liveImage =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDFZRQtN8hipOSj2Hoz59rmI3dtOxsp78-TjgirkCLenjJ1gt6Ad_NyB8vHp2gLT4TDRPlB6pKxQ2e0zOUzP3DDeWg52XzIibb-swkSdTtiPi456ijNu7LckrZI5BwwsfR4Hpa_Z5_mgwhWXBkMaaTL2p08QGOsNnZMhpDApNZwY6oL67cYDn1NFyHyaPHlon5mmMgw1QGZyaqOQunTuyOlkeA9u4hvXuHNhQExeU5M";
  const mapsUrl = "https://maps.google.com/?q=Sivan+Mahal+Salem+Tamil+Nadu";

  return (
    <main className="wedding-site">
      <header className="wedding-nav">
        <div className="wedding-nav-inner">
          <Brand className="wedding-brand" href={homeHref} />
          <nav className="wedding-links" aria-label="Wedding website">
            <a href="#our-story">Our Story</a>
            <a href="#wedding-events">Events</a>
            <a href="#digital-invitation">Invitation</a>
            <a href="#venue">Venue</a>
            <a href="#gallery">Gallery</a>
            <a href="#live">Live</a>
          </nav>
          <Link className="wedding-login" href="/login">
            Login
          </Link>
        </div>
      </header>

      <div className="wedding-blessing-ribbon" aria-label="A wedding blessing">
        <span aria-hidden="true">✦</span>
        <span>May auspiciousness prevail · A sacred union bound by eternal grace</span>
        <span aria-hidden="true">✦</span>
      </div>

      <section className="wedding-hero" id="home" aria-labelledby="wedding-title">
        <div className="wedding-hero-glow" aria-hidden="true" />
        <div className="wedding-hero-content">
          {welcomeHero ? (
            <>
              <h1 className="wedding-serif wedding-welcome-title" id="wedding-title">
                Welcome to Our Wedding Celebration
              </h1>
              <p className="wedding-hero-intro">
                Join us in celebrating love, family, and a beautiful new beginning.
              </p>
            </>
          ) : (
            <>
              <span className="wedding-invocation">With the blessings of the elders</span>
              <p className="wedding-hero-intro">
                Together with their beloved families, we invite you to celebrate the sacred union of
              </p>
              <h1 className="wedding-serif" id="wedding-title">
                Dinesh <span aria-hidden="true">&amp;</span> Usha
              </h1>
            </>
          )}
          <div className="wedding-flourish" aria-hidden="true">
            <span />
            <span>♥</span>
            <span />
          </div>
          {!welcomeHero && (
            <p className="wedding-hero-blessing">
              An auspicious union bound by Vedic grace and eternal companionship
            </p>
          )}

          <div className="wedding-details-card" aria-label="Wedding date, time, and venue">
            <div className="wedding-detail">
              <span className="wedding-detail-icon" aria-hidden="true">
                ◷
              </span>
              <span>
                <small>Date</small>
                <strong>20 January 2027</strong>
              </span>
            </div>
            <div className="wedding-detail">
              <span className="wedding-detail-icon" aria-hidden="true">
                ✧
              </span>
              <span>
                <small>Auspicious Muhurtham</small>
                <strong>6:00–7:30 AM</strong>
              </span>
            </div>
            <div className="wedding-detail">
              <span className="wedding-detail-icon" aria-hidden="true">
                ⌖
              </span>
              <span>
                <small>Venue</small>
                <strong>Sivan Mahal, Salem</strong>
              </span>
            </div>
          </div>

          {!welcomeHero && (
            <>
              <p className="wedding-hero-description">
                With gratitude for ancient traditions and the love of our families, we look forward
                to beginning our life together surrounded by the people who mean the most to us.
              </p>
              <div className="wedding-actions">
                <a className="wedding-button" href="#digital-invitation">
                  View full invitation
                </a>
                <a className="wedding-button wedding-button-outline" href="#wedding-events">
                  Wedding events &amp; itinerary
                </a>
              </div>
              <p className="wedding-hero-footer">Sacred vows · Hand in hand · Seven sacred steps</p>
            </>
          )}
        </div>
      </section>

      <section className="wedding-section wedding-story" id="our-story">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Our journey"
            title="Two hearts, two families, one beautiful beginning"
            description="From the first conversation to the blessings of our engagement, here is the path that brought us together."
          />
          <div className="story-milestones">
            <article className="story-milestone">
              <span className="milestone-number">01</span>
              <span className="wedding-eyebrow">Coastal meeting · 2023</span>
              <h3 className="wedding-serif">The First Meeting</h3>
              <p>
                An afternoon conversation over coffee turned into hours of discovering shared
                values, stories, and an unexpected kinship.
              </p>
              <span className="milestone-signoff">Where it all began</span>
            </article>
            <article className="story-milestone">
              <span className="milestone-number milestone-number-gold">02</span>
              <span className="wedding-eyebrow">Formal engagement · 2025</span>
              <h3 className="wedding-serif">The Family Blessing</h3>
              <p>
                With betel leaves, jasmine, and prayers, our families blessed our promise to step
                into married life together.
              </p>
              <span className="milestone-signoff">Pledges exchanged</span>
            </article>
            <article className="story-milestone">
              <span className="milestone-number milestone-number-burgundy">03</span>
              <span className="wedding-eyebrow">Muhurtham · 2027</span>
              <h3 className="wedding-serif">Walking Towards Forever</h3>
              <p>
                Guided by tradition and the blessings of our elders, we invite you to witness our
                wedding and celebrate this new beginning.
              </p>
              <span className="milestone-signoff">An eternal bond</span>
            </article>
          </div>
          <blockquote className="wedding-quote">
            <span className="quote-mark" aria-hidden="true">
              “
            </span>
            <div>
              <p>
                In every step we take around the sacred fire, we carry the warmth of our ancestors
                and the promise of lifelong companionship.
              </p>
              <cite>— Dinesh &amp; Usha</cite>
            </div>
          </blockquote>
        </div>
      </section>

      <section className="wedding-section" id="wedding-events">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Auspicious ceremony"
            title="Wedding Celebrations & Sacred Rites"
            description="We would be honoured by your presence at each of these special moments."
          />
          <div className="event-timeline">
            {events.map((event, index) => (
              <article
                className={`event-card${index === 1 ? " event-card-featured" : ""}`}
                key={event.name}
              >
                <div className="event-card-topline">
                  <span className="event-tag">
                    {index === 1 ? "Ritual joy & blessings" : "Wedding celebration"}
                  </span>
                  <span className="event-number">0{index + 1}</span>
                </div>
                <h3 className="wedding-serif">{event.name}</h3>
                <p className="event-note">{event.note}</p>
                <div className="event-meta">
                  <span>
                    <small>Date</small>
                    <strong>{event.date}</strong>
                  </span>
                  <span>
                    <small>Time</small>
                    <strong>{event.time}</strong>
                  </span>
                  <span>
                    <small>Venue</small>
                    <strong>Sivan Mahal, Salem</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wedding-section wedding-invitation-section" id="digital-invitation">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Sacred digital invitation"
            title="A Wedding Invitation"
            description="With divine grace and the love of our families, we invite you to share in our celebration."
          />
          <article className="invitation-card">
            <span className="invitation-emblem" aria-hidden="true">
              ம
            </span>
            <span className="wedding-eyebrow">Divine blessings · Auspicious union</span>
            <p className="invitation-message">
              Together with our families, we warmly solicit your gracious presence and blessings on
              the occasion of our wedding.
            </p>
            <h3 className="wedding-serif">
              {welcomeHero ? "Bride" : "Dinesh"} <span>&amp;</span> {welcomeHero ? "Groom" : "Usha"}
            </h3>
            <div className="invitation-divider">
              <span>✦</span>
            </div>
            <p className="invitation-date">Wednesday, 20 January 2027</p>
            <p className="invitation-time">Auspicious Muhurtham · 6:00–7:30 AM</p>
            <p className="invitation-venue">Sivan Mahal · Salem, Tamil Nadu</p>
            <a className="wedding-text-link" href={mapsUrl} target="_blank" rel="noreferrer">
              View venue directions <span aria-hidden="true">↗</span>
            </a>
          </article>
        </div>
      </section>

      <section className="wedding-section" id="venue">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Venue & accessibility"
            title="Wedding Venue &amp; Direction Guide"
            description="We look forward to welcoming you to Sivan Mahal in Salem."
          />
          <div className="venue-layout">
            <div className="venue-card">
              <span className="wedding-eyebrow">Muhurtham hall</span>
              <h3 className="wedding-serif">Sivan Mahal</h3>
              <p className="venue-address">Salem, Tamil Nadu</p>
              <div className="venue-facts">
                <span>Wedding ceremony</span>
                <span>Wednesday · 20 January 2027</span>
                <span>6:00–7:30 AM</span>
              </div>
              <a className="wedding-button" href={mapsUrl} target="_blank" rel="noreferrer">
                Open in Google Maps <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="venue-map">
              <Image
                src={mapImage}
                alt="Map showing Sivan Mahal in Salem"
                fill
                unoptimized
                sizes="(max-width: 760px) 100vw, 60vw"
              />
              <div className="venue-map-label">
                <span className="venue-map-pin" aria-hidden="true">
                  ⌖
                </span>
                <span>
                  <strong>Sivan Mahal, Salem</strong>
                  <small>Salem, Tamil Nadu</small>
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open Sivan Mahal in Google Maps"
                >
                  ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wedding-section wedding-gallery-section" id="gallery">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Visual chronicle"
            title="The Wedding Gallery"
            description="A few cherished details and moments from the celebrations around our wedding."
          />
          <div className="gallery-categories" aria-label="Gallery categories">
            <span className="gallery-category gallery-category-active">All Photos</span>
            <span className="gallery-category">Engagement</span>
            <span className="gallery-category">Nalangu</span>
            <span className="gallery-category">Muhurtham</span>
            <span className="gallery-category">Family &amp; Friends</span>
          </div>
          <div className="gallery-grid">
            {gallery.map((item) => (
              <figure className="gallery-tile" key={item.title}>
                <div className="gallery-image-wrap">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    unoptimized
                    sizes="(max-width: 680px) 90vw, (max-width: 1000px) 45vw, 33vw"
                  />
                </div>
                <figcaption>
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="gallery-upload-note">
            <span className="upload-note-icon" aria-hidden="true">
              ＋
            </span>
            <span>
              <strong>Share your wedding moments</strong>
              <small>
                Guest photo uploads will be available when the wedding gallery is connected.
              </small>
            </span>
            <span className="gallery-upload-status">Coming soon</span>
          </div>
        </div>
      </section>

      <section className="wedding-section" id="live">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Global virtual mandapam"
            title="Wedding Live Broadcast"
            description="If you cannot be with us in person, we hope to share the celebration with you online."
          />
          <div className="live-layout">
            <div className="live-poster">
              <Image
                src={liveImage}
                alt="The wedding mandapam prepared for the ceremony"
                fill
                unoptimized
                sizes="(max-width: 760px) 100vw, 60vw"
              />
              <div className="live-poster-shade" />
              <span className="live-status">
                <i /> Details coming soon
              </span>
              <div className="live-poster-caption">
                <span className="live-play" aria-hidden="true">
                  ▶
                </span>
                <span>
                  <strong>Sacred Muhurtham</strong>
                  <small>20 January 2027 · 6:00 AM IST</small>
                </span>
              </div>
            </div>
            <aside className="live-info-card">
              <span className="wedding-eyebrow">Join us live</span>
              <h3 className="wedding-serif">Celebrate from wherever you are</h3>
              <p>The couple will share viewing details here when the livestream is ready.</p>
              <div className="live-info-row">
                <span>Broadcast date</span>
                <strong>20 January 2027</strong>
              </div>
              <div className="live-info-row">
                <span>Start time</span>
                <strong>6:00 AM IST</strong>
              </div>
              <div className="live-info-row">
                <span>Venue</span>
                <strong>Sivan Mahal, Salem</strong>
              </div>
              <span className="live-unavailable">Livestream link not available yet</span>
            </aside>
          </div>
        </div>
      </section>

      <section className="wedding-section wedding-family-section" id="family">
        <div className="wedding-content">
          <SectionHeading
            eyebrow="Lineage & heritage"
            title="With the Blessings of Our Families"
            description="Marriage is the sacred union of two loving homes, guided by the wisdom of our elders."
          />
          <div className="family-grid">
            <article className="family-card">
              <span className="family-symbol" aria-hidden="true">
                உ
              </span>
              <span className="wedding-eyebrow">Bride’s family</span>
              <h3 className="wedding-serif">Usha’s Family</h3>
              <p>With love and gratitude, they welcome you to share in this joyful occasion.</p>
              <span className="family-location">Salem, Tamil Nadu</span>
            </article>
            <article className="family-card">
              <span className="family-symbol family-symbol-burgundy" aria-hidden="true">
                தி
              </span>
              <span className="wedding-eyebrow">Groom’s family</span>
              <h3 className="wedding-serif">Dinesh’s Family</h3>
              <p>
                With warm regards, they invite you to bless the couple as they begin their life
                together.
              </p>
              <span className="family-location">Salem, Tamil Nadu</span>
            </article>
          </div>
        </div>
      </section>

      <section className="wedding-countdown-section" aria-labelledby="countdown-title">
        <div className="wedding-content">
          <span className="wedding-eyebrow">Sacred Muhurtham</span>
          <h2 className="wedding-serif" id="countdown-title">
            Counting Down to Forever
          </h2>
          <p>20 January 2027 · Sivan Mahal, Salem, Tamil Nadu</p>
          <WeddingCountdown targetDate="2027-01-20T06:00:00+05:30" />
          <a className="countdown-blessing-link" href="#digital-invitation">
            View the wedding invitation
          </a>
        </div>
      </section>

      <footer className="wedding-footer">
        <div className="wedding-footer-inner">
          <div>
            <Brand className="wedding-brand" href={homeHref} />
            <p>
              Celebrating the sacred union of Dinesh &amp; Usha with traditional rites and warm
              hospitality in Salem.
            </p>
          </div>
          <div className="footer-quick-links">
            <strong>Quick navigation</strong>
            <a href="#our-story">Our story</a>
            <a href="#wedding-events">Events</a>
            <a href="#digital-invitation">Digital invitation</a>
            <a href="#venue">Venue &amp; map</a>
            <a href="#gallery">Photo gallery</a>
            <a href="#family">Family</a>
          </div>
          <div className="footer-account">
            <strong>Make My Marriage</strong>
            <p>Wedding website preview · {slug}</p>
            <Link href="/login">Sign in to your account</Link>
          </div>
        </div>
        <div className="wedding-footer-bottom">
          <span>© 2027 Dinesh &amp; Usha Wedding</span>
          <span>Salem · Tamil Nadu</span>
        </div>
      </footer>
    </main>
  );
}
