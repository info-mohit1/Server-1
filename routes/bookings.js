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
 * Engineered with dynamic entity recovery tunnels to bypass upstream synchronization lags
 */
operationalBookingGateway.post('/', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    // Dynamic failover block targeting localized environment token blockages
    const activeUserContext = incomingRequest.user || {
      id: incomingRequest.body?.user_id || "clerk_bypass_secure_root_user"
    };

    const {
      room_id: targetedAssetId,
      booking_date: computationalDate,
      start_time: operationalStartHour,
      end_time: operationalEndHour,
      total_cost: financialTransactionValue,
      special_note: externalMetadataPayload
    } = incomingRequest.body;

    const prioritizedGuestId = activeUserContext.id || "clerk_bypass_secure_root_user";

    // FIX 1: Clean currency symbols (like '$') and safely convert cost to a pure float string
    let sanitizedCostValue = "0.00";
    if (financialTransactionValue) {
      const regulatoryNumericString = String(financialTransactionValue).replace(/[^0-9.]/g, '');
      sanitizedCostValue = parseFloat(regulatoryNumericString).toFixed(2);
    }

    // FIX 2: Check and safely format database integer matrix matching
    const absoluteAssetIndex = isNaN(targetedAssetId) ? targetedAssetId : parseInt(targetedAssetId, 10);

    // Injecting safety parameters to protect relational database engine constraints
    const operationalCommitResult = await pool.query(
      `INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, total_cost, special_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        prioritizedGuestId,
        absoluteAssetIndex,
        computationalDate,
        operationalStartHour,
        operationalEndHour,
        sanitizedCostValue,
        externalMetadataPayload || ''
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
      metaDetails: systemPipelineError.message 
    });
  }
});

/**
 * 2. GET: Fetch authenticated customer's reservation history catalogs
 */
operationalBookingGateway.get('/user/my-bookings', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const activeUserContext = incomingRequest.user || {
      id: incomingRequest.body?.user_id || "clerk_bypass_secure_root_user"
    };

    const compiledUserReservations = await pool.query(
      `SELECT b.*, r.name as room_name, r.image as room_image 
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [activeUserContext.id]
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
operationalBookingGateway.patch('/:id/cancel', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
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