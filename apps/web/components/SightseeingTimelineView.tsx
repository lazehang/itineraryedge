import type { GenerationSightseeingTimeline } from "@itineraryedge/shared";

type Props = {
  timeline: GenerationSightseeingTimeline;
};

export function SightseeingTimelineView({ timeline }: Props) {
  return (
    <ol className="timeline-list">
      {timeline.days.map((day) => (
        <li key={day.date} className="timeline-day">
          <div className="timeline-day-header">
            <strong>{day.date}</strong>
            <span className="muted">{day.theme}</span>
          </div>
          <ul className="timeline-items">
            {day.items.map((item) => (
              <li key={`${day.date}-${item.startTime}-${item.title}`}>
                <span className="timeline-time">
                  {item.startTime}–{item.endTime}
                </span>
                <span className="timeline-title">{item.title}</span>
                <span className="muted timeline-place">
                  {item.place} · {item.category}
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
