# Central Identity and User Management Platform

A microservices-based identity platform for a university, built with Node.js, Express, MongoDB (Mongoose) and JWT. Clients never talk to the internal services directly — everything goes through the **API Gateway**, which validates JWTs and roles before routing.

```
Client (Postman)
     |
     v
API Gateway (3000)  --JWT + Role Validation--
     |------------------|------------------|------------------|
     v                  v                  v                  v
Registration(4001)  Login(4002)      Admin(4003)         User(4004)
     |                  |                  |                  |
     v                  v                  v                  v
             MongoDB (one DB, one `users` collection, shared by all services)
```

## Services & Ports

| Service      | Port | Purpose                                              |
|--------------|------|-------------------------------------------------------|
| api-gateway  | 3000 | Single entry point. JWT + role validation. Routing.   |
| registration-service | 4001 | `POST /register/userregister` |
| login-service | 4002 | `POST /auth/login` |
| admin-service | 4003 | `GET /admin/searchuser`, `GET /admin/viewalluser`, `DELETE /admin/deluser` |
| user-service  | 4004 | `GET /user/viewprofile`, `PUT /user/updateprofile` |

## 1. Prerequisites

- Node.js 18+ and npm
- A MongoDB connection string. Easiest option: a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster, or a local `mongod` if you have MongoDB Community Server installed.

## 2. Install dependencies

From the project root, install each service's dependencies:

```bash
cd api-gateway && npm install && cd ..
cd registration-service && npm install && cd ..
cd login-service && npm install && cd ..
cd admin-service && npm install && cd ..
cd user-service && npm install && cd ..
```

Or, from the root, run:

```bash
npm run install:all
```

## 3. Configure environment variables

Each service has an `.env.example`. Copy it to `.env` in the same folder and fill in your values:

```bash
cp api-gateway/.env.example api-gateway/.env
cp registration-service/.env.example registration-service/.env
cp login-service/.env.example login-service/.env
cp admin-service/.env.example admin-service/.env
cp user-service/.env.example user-service/.env
```

**Important:** `JWT_SECRET` must be the **same value** in `api-gateway/.env` and `login-service/.env` (the gateway verifies tokens issued by the login service).

`MONGO_URI` must point all four data-touching services (registration, login, admin, user) at the **same database**, e.g.:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/university_platform
```

## 4. Run everything

Open 5 terminals (or use the root helper script):

```bash
# from project root, after npm install in root too
npm run dev
```

This uses `concurrently` to boot all 5 services together. Watch the console — each service logs when it connects to MongoDB and which port it's listening on.

Or run each manually in its own terminal:
```bash
cd api-gateway && npm start
cd registration-service && npm start
cd login-service && npm start
cd admin-service && npm start
cd user-service && npm start
```

## 5. Test with Postman

Import `postman_collection.json` (Postman → Import → File). It contains ready-made requests for every task below, hitting the Gateway at `http://localhost:3000` only — never the internal services directly, matching the assignment's architecture.

### Task 5 — Register
`POST http://localhost:3000/register/userregister`
```json
{
  "name": "Alice Student",
  "email": "alice@university.edu",
  "password": "Passw0rd!",
  "role": "user",
  "phone": "9999999999"
}
```
Registering the same email twice returns `409 Email already registered`. Passwords are hashed with bcrypt before being stored — check MongoDB directly and you'll see a `$2a$...` hash, never plaintext.

To create an **admin** account for testing, register again with `"role": "admin"`.

### Task 6 — Login
`POST http://localhost:3000/auth/login`
```json
{
  "email": "alice@university.edu",
  "password": "Passw0rd!",
  "role": "user"
}
```
Returns `{ "token": "<JWT>" }` on success. Wrong password, wrong email, or wrong role all return the same generic `401 Invalid email or password or role` (so an attacker can't tell which part was wrong). Save the token — every downstream request needs it in `Authorization: Bearer <token>`.

### Task 7 — JWT validation at the Gateway
The gateway rejects, before the request ever reaches Admin/User service:
- No `Authorization` header → `401 No token provided`
- Malformed/invalid token → `401 Invalid token`
- Expired token → `401 Token expired`
- Valid token but wrong role for the route → `403 Access denied`

### Task 8 — Admin APIs (need an admin token)
- `GET http://localhost:3000/admin/searchuser?query=alice`
- `GET http://localhost:3000/admin/viewalluser`
- `DELETE http://localhost:3000/admin/deluser` with body `{ "email": "alice@university.edu" }`

Searching for a name/email with no match returns `404 No user found` — capture that screenshot alongside a successful search.

### Task 9 — User APIs (need a user token)
- `GET http://localhost:3000/user/viewprofile`
- `PUT http://localhost:3000/user/updateprofile` with body e.g. `{ "name": "Alice A. Student", "phone": "8888888888" }`

Take a MongoDB screenshot before and after calling update to show the change.

### Task 10 — Cross-role & negative tests
All four of these are just re-running the requests above with a twist — capture each response:
a. No `Authorization` header on any `/admin/*` or `/user/*` call → `401 No token provided`
b. A garbage/edited token → `401 Invalid token`
c. An **admin** token used against `/user/viewprofile` → `403 Access denied: user role required`
d. A **user** token used against `/admin/viewalluser` → `403 Access denied: admin role required`

This is the security boundary the assignment asks for: role is baked into the JWT at login and re-checked on every gated request at the Gateway, so a user token can never satisfy an admin-only route and vice versa.

## 6. Push to GitHub (Task 11)

```bash
git init
git add .
git commit -m "Central Identity and User Management Platform - microservices"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/` and `.env` files, so secrets and dependencies won't be pushed.

## Project structure

```
university-platform/
├── api-gateway/
│   ├── index.js          # JWT + role validation, proxy routing
│   ├── package.json
│   └── .env.example
├── registration-service/
│   ├── index.js          # POST /register/userregister
│   ├── dbConnect.js
│   ├── models/User.js
│   ├── package.json
│   └── .env.example
├── login-service/
│   ├── index.js          # POST /auth/login
│   ├── dbConnect.js
│   ├── models/User.js
│   ├── package.json
│   └── .env.example
├── admin-service/
│   ├── index.js          # search/view all/delete users
│   ├── dbConnect.js
│   ├── models/User.js
│   ├── package.json
│   └── .env.example
├── user-service/
│   ├── index.js          # view/update own profile
│   ├── dbConnect.js
│   ├── models/User.js
│   ├── package.json
│   └── .env.example
├── postman_collection.json
├── package.json           # root helper (concurrently)
└── .gitignore
```
