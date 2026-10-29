-- Ledger columns for Worker B (Stripe checkout + webhook idempotency)
-- No secrets — nullable unique ids for idempotent writes from billing worker.

ALTER TABLE global_ledger ADD COLUMN stripe_checkout_session_id TEXT;
ALTER TABLE global_ledger ADD COLUMN stripe_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_ledger_stripe_checkout_session_id
  ON global_ledger (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_global_ledger_stripe_event_id
  ON global_ledger (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
