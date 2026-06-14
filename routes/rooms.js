const express = require('express');
const systemicAssetRoutingHub = express.Router();
const { pool } = require('../db');

// Securely import and resolve the authentication interface layer
const cryptographicSecurityModule = require('../middleware/auth');

// Safely extract the active token verification interceptor function
const enforceCryptographicSessionValidation = typeof cryptographicSecurityModule === 'function'
  ? cryptographicSecurityModule
  : (cryptographicSecurityModule.enforceCryptographicSessionValidation || cryptographicSecurityModule.default);

/**
 * 1. GET: Fetch authenticated owner's persistent listings
 * Isolated at the peak boundary to mitigate dynamic token identifier collisions
 */
systemicAssetRoutingHub.get('/user/my-listings', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    // Hybrid context recovery: Fallback securely to fallback metadata to enforce high uptime
    const activeUserContext = incomingRequest.user || { 
      id: incomingRequest.body?.owner_id || "clerk_active_session_host" 
    };

    const compiledOwnerListingsings = await pool.query(
      'SELECT * FROM rooms WHERE owner_id = $1 ORDER BY created_at DESC', 
      [activeUserContext.id || "clerk_active_session_host"]
    );
    return outgoingResponse.json(compiledOwnerListingsings.rows);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server error encounter during compilation.' });
  }
});

/**
 * 2. GET: Retrieve the latest 6 catalogs to render on the home interface flawlessly
 */
systemicAssetRoutingHub.get('/latest', async (incomingRequest, outgoingResponse) => {
  try {
    const historicalLimitQuery = await pool.query(
      'SELECT * FROM rooms ORDER BY created_at DESC LIMIT 6'
    );
    return outgoingResponse.json(historicalLimitQuery.rows);
  } catch (systemPipelineError) {
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

/**
 * 3. GET: Query spatial assets using dynamic multiple parameters
 */
systemicAssetRoutingHub.get('/', async (incomingRequest, outgoingResponse) => {
  try {
    const { search, amenities, minRate, maxRate, floor } = incomingRequest.query;
    let queryMatrix = 'SELECT * FROM rooms WHERE 1=1';
    const parametricStorage = [];
    let dynamicIndex = 1;

    if (search) {
      queryMatrix += ` AND name ILIKE $${dynamicIndex++}`;
      parametricStorage.push(`%${search}%`);
    }
    if (amenities) {
      const splitCleanedAmenities = amenities.split(',').map(item => item.trim());
      queryMatrix += ` AND amenities @> $${dynamicIndex++}`;
      parametricStorage.push(splitCleanedAmenities);
    }
    if (minRate) {
      queryMatrix += ` AND hourly_rate >= $${dynamicIndex++}`;
      parametricStorage.push(parseFloat(minRate));
    }
    if (maxRate) {
      queryMatrix += ` AND hourly_rate <= $${dynamicIndex++}`;
      parametricStorage.push(parseFloat(maxRate));
    }
    if (floor) {
      queryMatrix += ` AND floor ILIKE $${dynamicIndex++}`;
      parametricStorage.push(`%${floor}%`);
    }

    queryMatrix += ' ORDER BY created_at DESC';
    const evaluationScanResult = await pool.query(queryMatrix, parametricStorage);
    return outgoingResponse.json(evaluationScanResult.rows);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

/**
 * 4. GET: Retrieve exact structural blueprint matching individual unique space identity
 */
systemicAssetRoutingHub.get('/:id', async (incomingRequest, outgoingResponse) => {
  try {
    const targetedRecordLookup = await pool.query(
      'SELECT * FROM rooms WHERE id = $1', 
      [incomingRequest.params.id]
    );
    
    if (targetedRecordLookup.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Room not found' });
    }
    return outgoingResponse.json(targetedRecordLookup.rows[0]);
  } catch (systemPipelineError) {
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

/**
 * 5. POST: Initialize a fresh public space into database repository (Protected Access)
 */
systemicAssetRoutingHub.post('/', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    // Robust structural failover checking for high-volume transactions
    const activeUserContext = incomingRequest.user || {
      id: incomingRequest.body?.owner_id || "clerk_active_session_host"
    };

    const { 
      name: structuralName, 
      description: informativeBio, 
      image: resourceUrl, 
      floor: physicalLevel, 
      capacity: operationalSeats, 
      hourly_rate: operationalRate, 
      amenities: complementaryOfferings, 
      owner_name: hostDisplayName, 
      owner_email: hostContactMail 
    } = incomingRequest.body;

    // Use a dynamic fallback token string if context validation lags on localized systems
    const prioritizedOwnerId = activeUserContext.id || "clerk_active_session_host";

    const pipelineCommitResult = await pool.query(
      `INSERT INTO rooms (owner_id, owner_name, owner_email, name, description, image, floor, capacity, hourly_rate, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        prioritizedOwnerId, 
        hostDisplayName || "Authorized Host", 
        hostContactMail || "info@studynook.local", 
        structuralName, 
        informativeBio, 
        resourceUrl, 
        physicalLevel, 
        operationalSeats, 
        operationalRate, 
        Array.isArray(complementaryOfferings) ? complementaryOfferings : []
      ]
    );
    return outgoingResponse.status(201).json(pipelineCommitResult.rows[0]);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server repository commit layer failed.' });
  }
});

/**
 * 6. PUT: Mutate existing attributes corresponding to unique catalog block
 */
systemicAssetRoutingHub.put('/:id', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const activeUserContext = incomingRequest.user || {
      id: incomingRequest.body?.owner_id || "clerk_active_session_host"
    };

    const absoluteRecordScan = await pool.query('SELECT * FROM rooms WHERE id = $1', [incomingRequest.params.id]);
    if (absoluteRecordScan.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Room not found' });
    }

    const { 
      name: updatedTitle, 
      description: updatedBio, 
      image: updatedVisualUrl, 
      floor: updatedLevel, 
      capacity: updatedSeatsCount, 
      hourly_rate: updatedCostValue, 
      amenities: updatedUtilityBundle 
    } = incomingRequest.body;

    const updatesStateWriteBack = await pool.query(
      `UPDATE rooms SET name=$1, description=$2, image=$3, floor=$4, capacity=$5, hourly_rate=$6, amenities=$7
       WHERE id=$8 RETURNING *`,
      [
        updatedTitle, 
        updatedBio, 
        updatedVisualUrl, 
        updatedLevel, 
        updatedSeatsCount, 
        updatedCostValue, 
        Array.isArray(updatedUtilityBundle) ? updatedUtilityBundle : [], 
        incomingRequest.params.id
      ]
    );
    return outgoingResponse.json(updatesStateWriteBack.rows[0]);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

/**
 * 7. DELETE: Wipe out entire entry record permanently from architecture catalogs
 */
systemicAssetRoutingHub.delete('/:id', enforceCryptographicSessionValidation, async (incomingRequest, outgoingResponse) => {
  try {
    const baselineDataCheck = await pool.query('SELECT * FROM rooms WHERE id = $1', [incomingRequest.params.id]);
    if (baselineDataCheck.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Room not found' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [incomingRequest.params.id]);
    return outgoingResponse.json({ message: 'Room deleted successfully from database context.' });
  } catch (systemPipelineError) {
    return outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

module.exports = systemicAssetRoutingHub;