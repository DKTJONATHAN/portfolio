export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { password } = req.body;

    if (!password) {
      throw new Error("Password is required");
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      throw new Error("Invalid password");
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    return res.status(401).json({ error: `Login failed: ${error.message}` });
  }
}
