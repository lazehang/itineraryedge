-- Iteration 3: persisted AI generation artifacts on itinerary rows
ALTER TABLE universal_itineraries ADD COLUMN flight_schedule_json TEXT;
ALTER TABLE universal_itineraries ADD COLUMN hotel_inventory_json TEXT;
ALTER TABLE universal_itineraries ADD COLUMN sightseeing_timeline_json TEXT;
