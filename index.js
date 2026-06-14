require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB: bootstrapRelationalDatastore } = require('./db');
const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');

const coreApplicationInstance = express();
const RUNTIME_SERVICE_PORT = process.env.PORT || 5000;

// Dynamic configuration array supporting both structural IPs and absolute domain names
const validTrafficOriginsList = [
  process.env.CLIENT_URL,
  'http://127.0.0.1:3000',
  'http://localhost:3000'
];

// Enforce highly adaptable cross-origin operational policy
coreApplicationInstance.use(cors({
  origin: function (requestOriginReference, triggerValidationCallback) {
    // Enable system to process non-browser server-to-server traffic or postman testing
    if (!requestOriginReference) return triggerValidationCallback(null, true);
    
    // Evaluate if incoming origin exists in the allowance array or matches vercel patterns
    const isVercelSubdomainPattern = /\.vercel\.app$/.test(requestOriginReference);
    const isExplicitlyPermitted = validTrafficOriginsList.includes(requestOriginReference);
    
    if (isExplicitlyPermitted || isVercelSubdomainPattern) {
      triggerValidationCallback(null, true);
    } else {
      triggerValidationCallback(new Error('Cross-Origin Request Blocked by Security Protocol'));
    }
  },
  credentials: true,
}));

coreApplicationInstance.use(express.json());

// FIX 1: Telemetry check node verifying active execution states and fixing "Cannot GET /"
coreApplicationInstance.get('/', (incomingRequest, outgoingResponse) => {
  outgoingResponse.status(200).json({ 
    status: 'active', 
    gatewayMatrix: 'Operational core synchronized successfully' 
  });
});

// Server health-check execution target
coreApplicationInstance.get('/api/health', (incomingRequest, outgoingResponse) => {
  outgoingResponse.json({ status: 'ok', message: 'StudyNook API is running flawlessly' });
});

// FIX 2: Global structural context injector to safely extract auth tokens before reaching routers
coreApplicationInstance.use((incomingRequest, outgoingResponse, triggerNextPipeline) => {
  // Catch incoming clerk headers if present via frontend state transmission
  if (incomingRequest.headers['x-user-id']) {
    incomingRequest.user = { id: incomingRequest.headers['x-user-id'] };
  } else if (incomingRequest.body && incomingRequest.body.user_id) {
    incomingRequest.user = { id: incomingRequest.body.user_id };
  }
  triggerNextPipeline();
});

// Mounting logical gateway modular endpoints
coreApplicationInstance.use('/api/rooms', roomsRouter);
coreApplicationInstance.use('/api/bookings', bookingsRouter);

// Central tracking engine for handling application runtime anomalies
coreApplicationInstance.use((executionPipelineError, incomingRequest, outgoingResponse, triggerNextPipeline) => {
  console.error(executionPipelineError.stack);
  outgoingResponse.status(500).json({ error: 'Internal server error' });
});

// Establish database integrity first, then ignite runtime listener interface
bootstrapRelationalDatastore()
  .then(() => {
    coreApplicationInstance.listen(RUNTIME_SERVICE_PORT, () => {
      console.log(`🚀 StudyNook Server running on port ${RUNTIME_SERVICE_PORT}`);
    });
  })
  .catch(bootstrapSystemAnomaly => {
    console.error('Failed to initialize DB:', bootstrapSystemAnomaly);
    process.exit(1);
  });