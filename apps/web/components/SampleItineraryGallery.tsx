type SampleDay = {
  date: string;
  theme: string;
  items: Array<{ time: string; title: string; place: string }>;
};

type SampleItinerary = {
  id: string;
  title: string;
  destination: string;
  traveler: string;
  passport: string;
  dates: string;
  flight: string;
  hotel: string;
  days: SampleDay[];
};

const SAMPLES: SampleItinerary[] = [
  {
    id: "jp-tokyo",
    title: "Tokyo business visit",
    destination: "JP",
    traveler: "Alex Chen",
    passport: "SG",
    dates: "12 Apr 2026 → 18 Apr 2026",
    flight: "SQ 12 · SIN → HND · 12 Apr 01:15",
    hotel: "Hotel Gracery Shinjuku · 6 nights",
    days: [
      {
        date: "13 Apr",
        theme: "Meetings · Shinjuku",
        items: [
          { time: "09:30–11:30", title: "Client office visit", place: "Nishi-Shinjuku" },
          { time: "14:00–16:00", title: "Follow-up workshop", place: "Shinjuku" },
        ],
      },
      {
        date: "14 Apr",
        theme: "City day · Shibuya",
        items: [
          { time: "10:00–12:00", title: "Meiji Shrine walk", place: "Harajuku" },
          { time: "15:00–17:00", title: "Shibuya business district", place: "Shibuya" },
        ],
      },
    ],
  },
  {
    id: "fr-paris",
    title: "Paris family visit",
    destination: "FR",
    traveler: "Maria Santos",
    passport: "PH",
    dates: "03 Jun 2026 → 10 Jun 2026",
    flight: "AF 119 · MNL → CDG · 03 Jun 21:40",
    hotel: "Hotel du Louvre · 7 nights",
    days: [
      {
        date: "04 Jun",
        theme: "Arrival · 1st arr.",
        items: [
          { time: "11:00–13:00", title: "Hotel check-in & rest", place: "Louvre area" },
          { time: "16:00–18:00", title: "Family dinner", place: "Rue Saint-Honoré" },
        ],
      },
      {
        date: "05 Jun",
        theme: "Sightseeing",
        items: [
          { time: "09:30–12:00", title: "Musée du Louvre", place: "1st arr." },
          { time: "14:30–17:00", title: "Seine walk", place: "Pont Neuf" },
        ],
      },
    ],
  },
  {
    id: "ae-dubai",
    title: "Dubai conference trip",
    destination: "AE",
    traveler: "James Okoro",
    passport: "NG",
    dates: "20 Sep 2026 → 25 Sep 2026",
    flight: "EK 783 · LOS → DXB · 20 Sep 13:05",
    hotel: "Address Dubai Mall · 5 nights",
    days: [
      {
        date: "21 Sep",
        theme: "Conference day 1",
        items: [
          { time: "08:30–12:30", title: "Registration & keynotes", place: "DWTC" },
          { time: "14:00–17:30", title: "Panel sessions", place: "DWTC" },
        ],
      },
      {
        date: "22 Sep",
        theme: "Conference day 2",
        items: [
          { time: "09:00–12:00", title: "Workshops", place: "DWTC" },
          { time: "16:00–18:00", title: "Networking reception", place: "Downtown Dubai" },
        ],
      },
    ],
  },
];

function SampleFrame({ sample }: { sample: SampleItinerary }) {
  return (
    <figure className="shot">
      <div className="shot__chrome" aria-hidden="true">
        <span className="shot__dot" />
        <span className="shot__dot" />
        <span className="shot__dot" />
        <span className="shot__url">itineraryedge.app / packet</span>
      </div>
      <div className="shot__screen">
        <div className="shot__kicker">
          <span className="badge">Draft itinerary</span>
          <span className="badge">{sample.destination}</span>
          <span className="badge badge-ai">AI filled</span>
        </div>
        <h3 className="shot__title">{sample.title}</h3>
        <p className="shot__meta">
          {sample.traveler} · passport {sample.passport} · {sample.dates}
        </p>

        <dl className="shot__summary">
          <div>
            <dt>Flight</dt>
            <dd>{sample.flight}</dd>
          </div>
          <div>
            <dt>Stay</dt>
            <dd>{sample.hotel}</dd>
          </div>
        </dl>

        <div className="shot__days">
          {sample.days.map((day) => (
            <div key={day.date} className="shot__day">
              <div className="shot__day-head">
                <strong>{day.date}</strong>
                <span>{day.theme}</span>
              </div>
              <ul>
                {day.items.map((item) => (
                  <li key={`${day.date}-${item.title}`}>
                    <span className="shot__time">{item.time}</span>
                    <span className="shot__item-title">{item.title}</span>
                    <span className="shot__place">{item.place}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="shot__caption">
        Sample {sample.destination} packet · illustrative only
      </figcaption>
    </figure>
  );
}

export function SampleItineraryGallery() {
  return (
    <section className="section samples" aria-labelledby="samples-title">
      <h2 id="samples-title" className="section__title">
        Sample itineraries
      </h2>
      <p className="section__lede">
        Examples of the schedule layout applicants review before downloading a PDF. Names and trips
        are illustrative — not real bookings or visa outcomes.
      </p>
      <div className="samples__rail">
        {SAMPLES.map((sample) => (
          <SampleFrame key={sample.id} sample={sample} />
        ))}
      </div>
    </section>
  );
}
