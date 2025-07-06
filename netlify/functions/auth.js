const fs = require('fs');
const path = require('path');

// Set your admin PIN here
const ADMIN_PIN = '1234'; // Change this to your desired PIN

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { pin } = JSON.parse(event.body);
        
        if (pin === ADMIN_PIN) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, error: 'Invalid PIN' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};