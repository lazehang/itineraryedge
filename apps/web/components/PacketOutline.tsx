/** Product preview: packet fields + which parts AI can fill. */
export function PacketOutline() {
  return (
    <aside className="outline" aria-label="What the travel packet includes">
      <header className="outline__head">
        <p className="outline__doc">Travel schedule packet</p>
        <span className="badge badge-ai">AI fill</span>
      </header>
      <ol className="outline__list">
        <li>
          <span>Traveler &amp; passport</span>
          <span>You enter</span>
        </li>
        <li>
          <span>Destination &amp; dates</span>
          <span>You enter</span>
        </li>
        <li className="is-ai">
          <span>Flight schedule</span>
          <span>AI</span>
        </li>
        <li className="is-ai">
          <span>Hotel stay</span>
          <span>AI</span>
        </li>
        <li className="is-ai">
          <span>Day-by-day plan</span>
          <span>AI</span>
        </li>
        <li>
          <span>PDF download</span>
          <span>Export</span>
        </li>
      </ol>
      <p className="outline__foot">
        Review every generated line before you attach the PDF. Supporting document only — not a
        visa or guarantee of entry.
      </p>
    </aside>
  );
}
