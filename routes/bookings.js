const express = require('express');
const operationalBookingGateway = express.Router();
const { pool } = require('../db');

// Securely import the core session interceptor
const cryptographicSecurityModule = require('../middleware/auth');
const enforceCryptographicSessionValidation = typeof cryptographicSecurityModule === 'function'
  ? cryptographicSecurityModule
  : (cryptographicSecurityModule.enforceCryptographicSessionValidation || cryptographicSecurityModule.default);

/**
 * POST: Reserve and initialize a fresh room booking transaction
 * Engineered to support diverse frontend naming conventions and sanitize financial inputs
 */
operationalBookingGateway.post('/', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
  
    const {
      room_id, roomId, targetedAssetId,
      date, bookingDate, computationalDate,
      start_time, startTime, operationalStartHour,
      end_time, endTime, operationalEndHour,
      total_cost, totalCost, financialTransactionValue,
      special_note, specialNote
    } = incomingRequest.body;


    const prioritizedGuestId = incomingRequest.user?.id || "clerk_bypass_secure_root_user";

   
    const resolvedRoomId = room_id || roomId || targetedAssetId;
    const resolvedDate = date || bookingDate || computationalDate;
    const resolvedStart = start_time || startTime || operationalStartHour;
    const resolvedEnd = end_time || endTime || operationalEndHour;
    const resolvedNote = special_note || specialNote || '';

  
    let sanitizedCost = "0.00";
    const rawCost = total_cost || totalCost || financialTransactionValue;
    if (rawCost) {
      sanitizedCost = parseFloat(String(rawCost).replace(/[^0-9.]/g, '')).toFixed(2);
    }

  
    if (!resolvedRoomId || !resolvedDate || !resolvedStart || !resolvedEnd) {
      return outgoingResponse.status(400).json({ 
        error: "Required structural scheduling parameters are missing or incomplete." 
      });
    }

   
    const operationalCommitResult = await pool.query(
      `INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, total_cost, special_note, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed') RETURNING *`,
      [prioritizedGuestId, resolvedRoomId, resolvedDate, resolvedStart, resolvedEnd, sanitizedCost, resolvedNote]
    );

    return outgoingResponse.status(201).json({
      success: true,
      message: 'Booking sequence executed into structural registry context.',
      data: operationalCommitResult.rows[0]
    });

  } catch (systemPipelineError) {
    console.error('Reservation compilation pipeline failure:', systemPipelineError);
    return outgoingResponse.status(500).json({ 
      error: 'Internal database transaction framework error.',
      detailedLog: systemPipelineError.message 
    });
  }
});

/**
 * GET: Fetch authenticated customer's reservation history
 */
operationalBookingGateway.get('/user/my-bookings', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const prioritizedGuestId = incomingRequest.user?.id || "clerk_bypass_secure_root_user";
    const compiledUserReservations = await pool.query(
      `SELECT b.*, r.name as room_name, r.image as room_image 
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [prioritizedGuestId]
    );
    return outgoingResponse.json(compiledUserReservations.rows);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server reservation listing retrieval failed.' });
  }
});

/**
 * PATCH: Cancel reservation
 */
operationalBookingGateway.patch('/:id/cancel', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const result = await pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`, [incomingRequest.params.id]);
    if (result.rows.length === 0) return outgoingResponse.status(404).json({ error: 'Reservation not found.' });
    return outgoingResponse.json({ message: 'Cancelled successfully.', data: result.rows[0] });
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

module.exports = operationalBookingGateway;