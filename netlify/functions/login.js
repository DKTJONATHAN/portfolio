import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  const { password } = JSON.parse(event.body);
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return {
      statusCode: 200,
      body: JSON.stringify({ token })
    };
  }
  return {
    statusCode: 401,
    body: JSON.stringify({ message: 'Invalid password' })
  };
};