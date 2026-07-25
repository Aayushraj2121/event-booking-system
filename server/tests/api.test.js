import http from 'http'

const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const data = body ? JSON.stringify(body) : ''
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api' + path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }
  if (token) options.headers['Authorization'] = 'Bearer ' + token

  const req = http.request(options, res => {
    let raw = ''
    res.on('data', chunk => raw += chunk)
    res.on('end', () => {
      try {
        resolve({ status: res.statusCode, data: JSON.parse(raw || '{}') })
      } catch (e) {
        resolve({ status: res.statusCode, data: raw })
      }
    })
  })
  req.on('error', reject)
  if (data) req.write(data)
  req.end()
})

async function runTestSuite() {
  console.log("=================================================")
  console.log("    EVENTLY AUTOMATED INTEGRATION TEST SUITE     ")
  console.log("=================================================\n")

  let passed = 0
  let failed = 0

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  [PASS] ✅ ${title}`)
      passed++
    } else {
      console.log(`  [FAIL] ❌ ${title}`)
      failed++
    }
  }

  const ts = Date.now()
  const orgEmail = `test_org_${ts}@evently.com`
  const userEmail = `test_user_${ts}@evently.com`

  try {
    // Test 1: Organizer Registration & OTP
    const orgReg = await request('POST', '/auth/register', { name: "Test Org", email: orgEmail, phone: "+919876543210", password: "Password123", role: "organizer" })
    assert(orgReg.status === 201 && orgReg.data.token, "Organizer Registration & Token Generation")
    const orgToken = orgReg.data.token

    // Test 2: User Registration & OTP Verification
    const userReg = await request('POST', '/auth/register', { name: "Test User", email: userEmail, phone: "+919123456789", password: "Password123", role: "user" })
    assert(userReg.status === 201 && userReg.data.requiresOtp, "User Registration & Mandatory OTP Requirement")
    const userToken = userReg.data.token
    const demoOtp = userReg.data.demoOtp

    const otpVerify = await request('POST', '/auth/verify-otp', { otp: demoOtp }, userToken)
    assert(otpVerify.status === 200 && otpVerify.data.user.phoneVerified, "6-Digit OTP Verification (Phone & Email)")

    // Test 3: Event Creation
    const createEvent = await request('POST', '/events', {
      title: "Automated Test Festival 2026",
      description: "Test event for automated suite.",
      category: "Technology", date: "2026-12-31", time: "10:00",
      venue: "Tech Park", city: "Bangalore",
      ticketsTotal: 100, price: 500
    }, orgToken)
    assert(createEvent.status === 201 && createEvent.data.event._id, "Event Creation & Publishing")
    const eventId = createEvent.data.event._id

    // Test 4: Dynamic VIP Seat Booking
    const bookingRes = await request('POST', '/bookings', { eventId, seats: 2, selectedSeats: ["A-01", "A-02"] }, userToken)
    assert(bookingRes.status === 201 && bookingRes.data.booking.totalPrice === 1500, "Dynamic VIP Seat Pricing (1.5x Premium Multiplier)")
    const bookingRef = bookingRes.data.booking.bookingRef

    // Test 5: Venue Door Check-in
    const checkInRes = await request('PATCH', `/bookings/check-in/${bookingRef}`, null, orgToken)
    assert(checkInRes.status === 200 && checkInRes.data.booking.checkedIn, "Venue Ticket Door Check-in Validation")

  } catch (err) {
    console.error("Test Suite Execution Error:", err)
    failed++
  }

  console.log("\n=================================================")
  console.log(` RESULTS: ${passed} Passed | ${failed} Failed`)
  console.log("=================================================")

  if (failed > 0) process.exit(1)
}

runTestSuite()
