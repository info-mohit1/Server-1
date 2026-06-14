const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const validateUserSession = require('../middleware/auth');

// POST: Establish a brand new space reservation (Protected Access)
router.post('/', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    // Structural security enforcement layer
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Complete profile validation required.' });
    }

    const { 
      room_id: targetedSpaceId, 
      date: reservationDate, 
      start_time: allocationStart, 
      end_time: allocationEnd, 
      total_cost: financialCharge, 
      special_note: additionalRequests, 
      user_name: registrantName, 
      user_email: registrantEmail 
    } = incomingRequest.body;

    // Execute absolute timeline collision scan to avoid double bookings
    const scheduleCollisionCheck = await pool.query(
      `SELECT id FROM bookings 
       WHERE room_id = $1 AND date = $2 AND status = 'confirmed'
       AND (start_time < $4 AND end_time > $3)`,
      [targetedSpaceId, reservationDate, allocationStart, allocationEnd]
    );

    if (scheduleCollisionCheck.rows.length > 0) {
      return outgoingResponse.status(409).json({ 
        error: 'This time slot is already booked. Please choose a different time.' 
      });
    }

    // Persist new reservation block into the persistent store
    const executionInsertionResult = await pool.query(
      `INSERT INTO bookings (room_id, user_id, user_name, user_email, date, start_time, end_time, total_cost, special_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        targetedSpaceId, 
        incomingRequest.user.id, 
        registrantName, 
        registrantEmail, 
        reservationDate, 
        allocationStart, 
        allocationEnd, 
        financialCharge, 
        additionalRequests
      ]
    );

    // Atomically increment metric data on targeted catalog space
    await pool.query(
      'UPDATE rooms SET booking_count = booking_count + 1 WHERE id = $1', 
      [targetedSpaceId]
    );

    outgoingResponse.status(201).json(executionInsertionResult.rows[0]);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// GET: Retrieve absolute historical logs belonging to verified profile
router.get('/my-bookings', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Profile reference unresolved.' });
    }

    // Dynamic join operation tracking active spatial properties
    const structuredLogsCollection = await pool.query(
      `SELECT b.*, r.name as room_name, r.image as room_image, r.floor as room_floor, r.hourly_rate
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [incomingRequest.user.id]
    );
    
    outgoingResponse.json(structuredLogsCollection.rows);
  } catch (systemPipelineError) {
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// PATCH: Enforce state mutation to transition reservation status to cancelled
router.patch('/:id/cancel', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Revocation privileges missing.' });
    }

    const verificationRecordLookup = await pool.query(
      'SELECT * FROM bookings WHERE id = $1', 
      [incomingRequest.params.id]
    );
    
    if (verificationRecordLookup.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Booking not found' });
    }
    
    if (verificationRecordLookup.rows[0].user_id !== incomingRequest.user.id) {
      return outgoingResponse.status(403).json({ error: 'Forbidden' });
    }

    // Execute state transition safely inside the table engine
    const postStateMutationResult = await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [incomingRequest.params.id]
    );

    // Decrement counter safely avoiding negative integer anomalies
    await pool.query(
      'UPDATE rooms SET booking_count = GREATEST(booking_count - 1, 0) WHERE id = $1', 
      [verificationRecordLookup.rows[0].room_id]
    );

    outgoingResponse.json(postStateMutationResult.rows[0]);
  } catch (systemPipelineError) {
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;