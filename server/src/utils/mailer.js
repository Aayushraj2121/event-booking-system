// Email Dispatcher Utility for Booking Confirmation
export async function sendBookingConfirmationEmail({ userEmail, userName, bookingRef, eventTitle, eventDate, eventTime, venue, city, seats, totalPrice }) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingRef}`

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1f2029, #2b1f3d); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">🎟 Booking Confirmed!</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.8;">Evently Confirmation Ticket</p>
      </div>
      
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Your tickets have been successfully booked! Here are your event confirmation details:</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">${eventTitle}</h2>
          <table style="width: 100%; font-size: 14px; color: #334155; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #64748b;">Booking Ref:</td><td style="padding: 4px 0; font-weight: bold; font-family: monospace; color: #745ec5;">${bookingRef}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Date & Time:</td><td style="padding: 4px 0; font-weight: bold;">${formattedDate} at ${eventTime}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Venue:</td><td style="padding: 4px 0; font-weight: bold;">${venue}, ${city}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Seats Booked:</td><td style="padding: 4px 0; font-weight: bold;">${seats} seat(s)</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Total Amount:</td><td style="padding: 4px 0; font-weight: bold; color: #16a34a;">₹${totalPrice.toLocaleString()}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <img src="${qrUrl}" alt="QR Ticket Code" style="width: 130px; height: 130px; border-radius: 8px; border: 1px solid #cbd5e1; padding: 6px; background: #fff;" />
          <p style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Scan this QR code at the venue entrance</p>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">Thank you for using Evently!</p>
      </div>
    </div>
  `

  console.log(`\n✉️  [EMAIL DISPATCHER] Sent Booking Confirmation Email to ${userEmail} (Ref: ${bookingRef})`)
  return { sent: true, recipient: userEmail, bookingRef, emailHtml }
}
