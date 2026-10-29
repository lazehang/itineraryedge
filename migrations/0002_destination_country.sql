-- Iteration 2 (PO flag A): queryable destination on universal_itineraries row

ALTER TABLE universal_itineraries
  ADD COLUMN destination_country TEXT NOT NULL DEFAULT '';
