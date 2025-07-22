exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { password } = JSON.parse(event.body);
  if (!password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing password" }) };
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid password" }) };
  }

  const token = Buffer.from(password).toString("base64");
  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};