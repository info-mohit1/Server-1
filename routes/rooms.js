const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const validateUserSession = require('../middleware/auth');

// 1. GET: Fetch authenticated owner's persistent listings (Placed on top to bypass placeholder conflicts)
router.get('/user/my-listings', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Owner profile context missing.' });
    }

    const compiledOwnerListingsings = await pool.query(
      'SELECT * FROM rooms WHERE owner_id = $1 ORDER BY created_at DESC', 
      [incomingRequest.user.id]
    );
    outgoingResponse.json(compiledOwnerListingsings.rows);
  } catch (systemPipelineError) {
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// 2. GET: Retrieve the latest 6 catalogs to render on the home interface flawlessly
router.get('/latest', async (incomingRequest, outgoingResponse) => {
  try {
    const historicalLimitQuery = await pool.query(
      'SELECT * FROM rooms ORDER BY created_at DESC LIMIT 6'
    );
    outgoingResponse.json(historicalLimitQuery.rows);
  } catch (systemPipelineError) {
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// 3. GET: Query spatial assets using dynamic multiple parameters
router.get('/', async (incomingRequest, outgoingResponse) => {
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
    outgoingResponse.json(evaluationScanResult.rows);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// 4. GET: Retrieve exact structural blueprint matching individual unique space identity
router.get('/:id', async (incomingRequest, outgoingResponse) => {
  try {
    const targetedRecordLookup = await pool.query(
      'SELECT * FROM rooms WHERE id = $1', 
      [incomingRequest.params.id]
    );
    
    if (targetedRecordLookup.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Room not found' });
    }
    outgoingResponse.json(targetedRecordLookup.rows[0]);
  } catch (systemPipelineError) {
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// 5. POST: Initialize a fresh public space into database repository (Protected Access)
router.post('/', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Action requires active session identity.' });
    }

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

    const pipelineCommitResult = await pool.query(
      `INSERT INTO rooms (owner_id, owner_name, owner_email, name, description, image, floor, capacity, hourly_rate, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        incomingRequest.user.id, 
        hostDisplayName, 
        hostContactMail, 
        structuralName, 
        informativeBio, 
        resourceUrl, 
        physicalLevel, 
        operationalSeats, 
        operationalRate, 
        Array.isArray(complementaryOfferings) ? complementaryOfferings : []
      ]
    );
    outgoingResponse.status(201).json(pipelineCommitResult.rows[0]);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// 6. PUT: Mutate existing attributes corresponding to unique catalog block (Ownership Restricted)
router.put('/:id', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Insufficient scope privileges.' });
    }

    const absoluteRecordScan = await pool.query('SELECT * FROM rooms WHERE id = $1', [incomingRequest.params.id]);
    if (absoluteRecordScan.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Room not found' });
    }
    if (absoluteRecordScan.rows[0].owner_id !== incomingRequest.user.id) {
      return outgoingResponse.status(403).json({ error: 'Forbidden' });
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
       WHERE id=$8 AND owner_id=$9 RETURNING *`,
      [
        updatedTitle, 
        updatedBio, 
        updatedVisualUrl, 
        updatedLevel, 
        updatedSeatsCount, 
        updatedCostValue, 
        Array.isArray(updatedUtilityBundle) ? updatedUtilityBundle : [], 
        incomingRequest.params.id, 
        incomingRequest.user.id
      ]
    );
    outgoingResponse.json(updatesStateWriteBack.rows[0]);
  } catch (systemPipelineError) {
    console.error(systemPipelineError);
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

// 7. DELETE: Wipe out entire entry record permanently from architecture catalogs (Ownership Restricted)
router.delete('/:id', validateUserSession, async (incomingRequest, outgoingResponse) => {
  try {
    if (!incomingRequest.user || !incomingRequest.user.id) {
      return outgoingResponse.status(401).json({ error: 'Unauthorized: Scope token parsing missing.' });
    }

    const baselineDataCheck = await pool.query('SELECT * FROM rooms WHERE id = $1', [incomingRequest.params.id]);
    if (baselineDataCheck.rows.length === 0) {
      return outgoingResponse.status(404).json({ error: 'Room not found' });
    }
    if (baselineDataCheck.rows[0].owner_id !== incomingRequest.user.id) {
      return outgoingResponse.status(403).json({ error: 'Forbidden' });
    }

    await pool.query('DELETE FROM rooms WHERE id = $1', [incomingRequest.params.id]);
    outgoingResponse.json({ message: 'Room deleted successfully' });
  } catch (systemPipelineError) {
    outgoingResponse.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;