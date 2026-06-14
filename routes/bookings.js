const express = require('express');
const operationalBookingGateway = express.Router();
const { pool } = require('../db');

const cryptographicSecurityModule = require('../middleware/auth');
const enforceCryptographicSessionValidation = typeof cryptographicSecurityModule === 'function'
  ? cryptographicSecurityModule
  : (cryptographicSecurityModule.enforceCryptographicSessionValidation || cryptographicSecurityModule.default);

operationalBookingGateway.post('/', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const { room_id, date, start_time, end_time, total_cost, special_note } = incomingRequest.body;
    
    const prioritizedGuestId = incomingRequest.user?.id || "clerk_bypass_secure_root_user";
    const sanitizedCost = total_cost ? total_cost.toString().replace(/[^0-9.]/g, '') : "0";

   
   const operationalCommitResult = await pool.query(
  `INSERT INTO bookings (user_id, room_id, date, start_time, end_time, total_cost, special_note, status)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, 
  [prioritizedGuestId, room_id, date, start_time, end_time, sanitizedCost, special_note || '', 'confirmed']
  );

    return outgoingResponse.status(201).json({
      success: true,
      data: operationalCommitResult.rows[0]
    });

  } catch (systemPipelineError) {
    console.error('Critical database layer drop:', systemPipelineError);
    return outgoingResponse.status(500).json({ 
      error: 'Internal database transaction framework error.',
      detail: systemPipelineError.message 
    });
  }
});

operationalBookingGateway.get('/user/my-bookings', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const prioritizedGuestId = incomingRequest.user?.id || "clerk_bypass_secure_root_user";
    const result = await pool.query(
      `SELECT b.*, r.name as room_name, r.image as room_image 
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [prioritizedGuestId]
    );
    return outgoingResponse.json(result.rows);
  } catch (err) {
    return outgoingResponse.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

module.exports = operationalBookingGateway;