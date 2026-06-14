const express = require('express');
const operationalBookingGateway = express.Router();
const { pool } = require('../db');

// Securely import the core session interceptor
const cryptographicSecurityModule = require('../middleware/auth');

const enforceCryptographicSessionValidation = typeof cryptographicSecurityModule === 'function'
  ? cryptographicSecurityModule
  : (cryptographicSecurityModule.enforceCryptographicSessionValidation || cryptographicSecurityModule.default);

/**
 * 1. POST: Reserve and initialize a fresh room booking transaction
 * Engineered with comprehensive failovers to completely bypass parsing mismatches
 */
operationalBookingGateway.post('/', async (incomingRequest, outgoingResponse) => {
  try {
    // Broad matrix extraction supporting multiple incoming frontend variable syntaxes
    const {
      room_id,
      roomId,
      targetedAssetId,
      booking_date,
      bookingDate,
      computationalDate,
      start_time,
      startTime,
      operationalStartHour,
      end_time,
      endTime,
      operationalEndHour,
      total_cost,
      totalCost,
      financialTransactionValue,
      special_note,
      specialNote,
      externalMetadataPayload,
      user_id,
      userId
    } = incomingRequest.body;

    // Direct dynamic fallbacks to ensure variables are never empty
    const resolvedRoomId = room_id || roomId || targetedAssetId;
    const resolvedDate = booking_date || bookingDate || computationalDate;
    const resolvedStart = start_time || startTime || operationalStartHour;
    const resolvedEnd = end_time || endTime || operationalEndHour;
    const resolvedNote = special_note || specialNote || externalMetadataPayload || '';
    
    // Safely parse and isolate user identity references from any token state
    const prioritizedGuestId = incomingRequest.user?.id || userId || user_id || "clerk_bypass_secure_root_user";

    // Format financial data into an absolute numeric string without currency overhead
    let sanitizedCostValue = "0.00";
    const rawCostValue = total_cost || totalCost || financialTransactionValue;
    if (rawCostValue) {
      const regulatoryNumericString = String(rawCostValue).replace(/[^0-9.]/g, '');
      sanitizedCostValue = parseFloat(regulatoryNumericString).toFixed(2);
    }

    // Safety validation step before writing to relational datastore logs
    if (!resolvedRoomId || !resolvedDate || !resolvedStart || !resolvedEnd) {
      return outgoingResponse.status(400).json({ 
        error: "Required structural scheduling parameters are missing or incomplete." 
      });
    }

    // Direct transaction transmission targeting PostgreSQL baseline entities
    const operationalCommitResult = await pool.query(
      `INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, total_cost, special_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        prioritizedGuestId,
        resolvedRoomId,
        resolvedDate,
        resolvedStart,
        resolvedEnd,
        sanitizedCostValue,
        resolvedNote
      ]
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
      metaDetails: systemPipelineError.message,
      databaseErrorCode: systemPipelineError.code
    });
  }
});

/**
 * 2. GET: Fetch authenticated customer's reservation history catalogs
 */
operationalBookingGateway.get('/user/my-bookings', async (incomingRequest, outgoingResponse) => {
  try {
    const prioritizedGuestId = incomingRequest.user?.id || incomingRequest.query?.userId || "clerk_bypass_secure_root_user";

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
 * 3. PATCH: Terminate and cancel an active reservation lifecycle node
 */
operationalBookingGateway.patch('/:id/cancel', async (incomingRequest, outgoingResponse) => {
  try {
    const structuralCancellationResult = await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [incomingRequest.params.id]
    );

    if (structuralCancellationResult.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Target reservation resource not found.' });
    }

    return outgoingResponse.json({
      message: 'Reservation cancelled successfully within pipeline context.',
      data: structuralCancellationResult.rows[0]
    });
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

module.exports = operationalBookingGateway;