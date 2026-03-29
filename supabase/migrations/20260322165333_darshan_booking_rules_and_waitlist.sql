/*
  # Darshan Booking Rules & Waitlist

  ## Summary
  Overhauls the darshan booking system to enforce:
  1. One booking per date (date is fully occupied once filled)
  2. Waitlist when the date slot is taken
  3. 6-month cooldown — a pilgrim (identified by contact number) cannot rebook within 6 months
  4. No money fields — amount/payment columns removed from new bookings (no money involvement)

  ## Changes

  ### Modified: `darshan_bookings`
  - Adds `is_waitlisted` boolean flag — true if the date was already taken when booked
  - Adds `waitlist_position` integer for ordering in waitlist
  - Adds `cooldown_until` date — the date until which this pilgrim cannot rebook
  - Adds `promoted_from_waitlist` boolean — true if this booking was promoted from waitlist
  - Adds `pilgrim_aadhar_last4` for identity without storing full sensitive ID

  ### New: `darshan_date_slots`
  - Tracks slot availability per date
  - One row per date, `is_filled` = true once the confirmed booking exists
  - `confirmed_booking_id` FK to the booked entry

  ## Notes
  - 6-month restriction is enforced at the application layer using cooldown_until stored here
  - Waitlist is ordered by created_at, promoted manually or automatically when main booking is cancelled
  - No payment fields are used — this is purely an administrative coordination system
*/

-- Add new columns to darshan_bookings if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'is_waitlisted') THEN
    ALTER TABLE darshan_bookings ADD COLUMN is_waitlisted boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'waitlist_position') THEN
    ALTER TABLE darshan_bookings ADD COLUMN waitlist_position integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'cooldown_until') THEN
    ALTER TABLE darshan_bookings ADD COLUMN cooldown_until date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'promoted_from_waitlist') THEN
    ALTER TABLE darshan_bookings ADD COLUMN promoted_from_waitlist boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'pilgrim_aadhar_last4') THEN
    ALTER TABLE darshan_bookings ADD COLUMN pilgrim_aadhar_last4 text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'mandal') THEN
    ALTER TABLE darshan_bookings ADD COLUMN mandal text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'village') THEN
    ALTER TABLE darshan_bookings ADD COLUMN village text DEFAULT '';
  END IF;
END $$;

-- Date slots table — 1 confirmed booking per date
CREATE TABLE IF NOT EXISTS darshan_date_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL UNIQUE,
  is_filled boolean NOT NULL DEFAULT false,
  confirmed_booking_id uuid REFERENCES darshan_bookings(id) ON DELETE SET NULL,
  waitlist_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE darshan_date_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view date slots"
  ON darshan_date_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert date slots"
  ON darshan_date_slots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update date slots"
  ON darshan_date_slots FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete date slots"
  ON darshan_date_slots FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
