const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

const identityVerificationEngine = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const validateUserSession = async (incomingRequest, outgoingResponse, triggerNextPipeline) => {
  try {
    const rawAuthorizationHeader = incomingRequest.headers.authorization;
    

    if (!rawAuthorizationHeader || !rawAuthorizationHeader.startsWith('Bearer ')) {
      incomingRequest.user = null; 
      return triggerNextPipeline();
    }

    const extractedCredentialToken = rawAuthorizationHeader.split(' ')[1];
    

    const decryptedTokenPayload = await identityVerificationEngine.verifyToken(extractedCredentialToken);
    

    incomingRequest.user = { id: decryptedTokenPayload.sub };
    

    triggerNextPipeline();
  } catch (executionError) {
  
    return outgoingResponse.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = validateUserSession;