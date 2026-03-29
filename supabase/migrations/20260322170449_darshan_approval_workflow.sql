/*
  # Darshan Approval Workflow

  ## Summary
  Adds a politician-only approval layer to the darshan booking system.
  All new bookings (both confirmed slot and waitlist) start in "Pending Approval" state.
  Only the politician can approve or reject them. On approval, an SMS is automatically
  triggered to the pilgrim with contact details and confirmation message.

  ## Changes

  ### Modified: `darshan_bookings`
  - `approval_status` — 'pending' | 'approved' | 'rejected' (default: 'pending')
  - `approved_at` — timestamp when the politician approved
  - `approved_by` — name/identifier of who approved
  - `rejection_reason` — optional reason when rejected
  - `sms_sent` — boolean, true once the confirmation SMS has been dispatched
  - `sms_sent_at` — timestamp of SMS dispatch
  - `contact_person` — name of office contact to relay in SMS
  - `contact_phone` — phone number to relay in SMS
  - `approval_notes` — optional notes from the politician during approval

  ## Security
  - The approval columns are write-accessible to authenticated users (politician logs in)
  - All existing RLS on darshan_bookings continues to apply
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approval_status') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approved_at') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approved_by') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approved_by text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'rejection_reason') THEN
    ALTER TABLE darshan_bookings ADD COLUMN rejection_reason text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'sms_sent') THEN
    ALTER TABLE darshan_bookings ADD COLUMN sms_sent boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'sms_sent_at') THEN
    ALTER TABLE darshan_bookings ADD COLUMN sms_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'contact_person') THEN
    ALTER TABLE darshan_bookings ADD COLUMN contact_person text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'contact_phone') THEN
    ALTER TABLE darshan_bookings ADD COLUMN contact_phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'darshan_bookings' AND column_name = 'approval_notes') THEN
    ALTER TABLE darshan_bookings ADD COLUMN approval_notes text DEFAULT '';
  END IF;
END $$;
