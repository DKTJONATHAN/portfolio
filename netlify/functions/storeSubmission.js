const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    };
  }

  try {
    // Parse incoming submission
    const submission = JSON.parse(event.body);
    
    // Validate required fields
    if (!submission.name || !submission.email || !submission.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Sanitize and enhance data
    const enhancedSubmission = {
      id: uuidv4(),
      name: sanitizeInput(submission.name),
      email: sanitizeInput(submission.email),
      service: submission.service || 'general',
      message: sanitizeInput(submission.message),
      timestamp: new Date().toISOString(),
      pageUrl: submission.pageUrl || 'direct',
      userAgent: submission.userAgent || 'unknown',
      referrer: submission.referrer || 'none',
      status: 'new',
      ip: event.headers['x-nf-client-connection-ip'] || 'unknown'
    };

    // Define paths
    const dataDir = path.join(process.cwd(), 'data');
    const submissionsFile = path.join(dataDir, 'submissions.json');
    const backupFile = path.join(dataDir, `submissions_${new Date().toISOString().split('T')[0]}.json`);

    // Create data directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true });

    // Read existing submissions or initialize
    let submissions = [];
    try {
      const fileData = await fs.readFile(submissionsFile, 'utf8');
      submissions = JSON.parse(fileData);
      
      // Create daily backup
      await fs.copyFile(submissionsFile, backupFile);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    // Add new submission
    submissions.push(enhancedSubmission);

    // Write to file with pretty formatting
    await fs.writeFile(
      submissionsFile,
      JSON.stringify(submissions, null, 2),
      'utf8'
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Submission stored successfully',
        submissionId: enhancedSubmission.id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error processing submission:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

// Helper function to sanitize inputs
function sanitizeInput(input) {
  return String(input)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 2000);
}