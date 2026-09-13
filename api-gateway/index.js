// Task 4 + Task 7: API Gateway
// Single entry point for all clients. Clients never talk to the internal
// microservices directly. This gateway:
//   1. Routes public auth traffic (/register, /auth) straight through.
//   2. Verifies JWT + role for /admin and /user traffic BEFORE proxying.
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const REGISTRATION_URL = process.env.REGISTRATION_URL || 'http://localhost:4001';
const LOGIN_URL = process.env.LOGIN_URL || 'http://localhost:4002';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:4003';
const USER_URL = process.env.USER_URL || 'http://localhost:4004';

// NOTE: We deliberately do NOT call express.json() here. If we parsed the
// body at the gateway, the raw stream would already be consumed and
// http-proxy-middleware would forward an empty body to the downstream
// service. The gateway only needs to read headers (Authorization), so we
// let the request body pass through untouched.

// ---------- Public routes (no auth required) ----------
app.use(
  '/register',
  createProxyMiddleware({ target: REGISTRATION_URL, changeOrigin: true })
);

app.use(
  '/auth',
  createProxyMiddleware({ target: LOGIN_URL, changeOrigin: true })
);

// ---------- JWT + Role validation middleware ----------
function authorize(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== requiredRole) {
        return res
          .status(403)
          .json({ message: `Access denied: ${requiredRole} role required` });
      }

      // Forward verified identity to the downstream microservice via headers.
      req.headers['x-user-id'] = decoded.id;
      req.headers['x-user-email'] = decoded.email;
      req.headers['x-user-role'] = decoded.role;

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

// ---------- Protected routes ----------
app.use(
  '/admin',
  authorize('admin'),
  createProxyMiddleware({ target: ADMIN_URL, changeOrigin: true })
);

app.use(
  '/user',
  authorize('user'),
  createProxyMiddleware({ target: USER_URL, changeOrigin: true })
);

app.get('/health', (req, res) => res.json({ status: 'API Gateway is running' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
