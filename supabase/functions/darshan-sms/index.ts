import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SMSPayload {
  booking_id: string;
  approved_by: string;
  approval_notes?: string;
  contact_person?: string;
  contact_phone?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: SMSPayload = await req.json();
    const { booking_id, approved_by, approval_notes, contact_person, contact_phone } = payload;

    const { data: booking, error: fetchError } = await supabase
      .from("darshan_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (fetchError || !booking) {
      return new Response(JSON.stringify({ success: false, error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pilgrimContact = booking.pilgrim_contact?.replace(/\D/g, "").slice(-10);
    if (!pilgrimContact || pilgrimContact.length < 10) {
      return new Response(JSON.stringify({ success: false, error: "Invalid contact number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const darshanDate = new Date(booking.darshan_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const contactLine = (contact_person || booking.contact_person) && (contact_phone || booking.contact_phone)
      ? `For queries contact: ${contact_person || booking.contact_person} - ${contact_phone || booking.contact_phone}.`
      : "";

    const smsMessage = `Dear ${booking.pilgrim_name}, your Tirupati Darshan request has been APPROVED by ${approved_by}. Date: ${darshanDate}. Darshan: ${booking.darshan_type}. ${contactLine} Please carry this message and a valid ID. - MP Office`;

    const fast2smsKey = Deno.env.get("FAST2SMS_API_KEY");

    let smsSent = false;
    let smsError = "";

    if (fast2smsKey) {
      const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: smsMessage,
          language: "english",
          flash: 0,
          numbers: pilgrimContact,
        }),
      });

      const smsData = await smsRes.json();
      smsSent = smsData.return === true;
      if (!smsSent) smsError = JSON.stringify(smsData);
    } else {
      smsError = "FAST2SMS_API_KEY not configured";
    }

    await supabase
      .from("darshan_bookings")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: approved_by,
        approval_notes: approval_notes || "",
        contact_person: contact_person || booking.contact_person || "",
        contact_phone: contact_phone || booking.contact_phone || "",
        sms_sent: smsSent,
        sms_sent_at: smsSent ? new Date().toISOString() : null,
        status: "Confirmed",
      })
      .eq("id", booking_id);

    return new Response(
      JSON.stringify({
        success: true,
        sms_sent: smsSent,
        sms_error: smsError || null,
        message: smsMessage,
        pilgrim_contact: `+91${pilgrimContact}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
