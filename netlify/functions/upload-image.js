const FormData = require("form-data");
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { token } = event.queryStringParameters || {};
  if (token !== Buffer.from(process.env.ADMIN_PASSWORD).toString("base64")) {
    return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const formData = new FormData();
    formData.append("file", Buffer.from(event.body, "base64"), "image.jpg");
    formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Image upload failed");
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ location: data.secure_url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Image upload failed: ${error.message}` }),
    };
  }
};