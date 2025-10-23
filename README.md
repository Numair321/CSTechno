# CSTech Project Setup Guide

This guide will help you set up and run the CSTech project (Node.js/Express backend + React frontend) on your local machine.

---

## Prerequisites
- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local or cloud instance)

---

## 1. Clone the Repository
```bash
git clone <your-repo-url>
cd CSTech
```

---

## 2. Backend Setup

### a. Install Dependencies
```bash
cd backend
npm install
```

### b. Configure Environment Variables
- Create a `.env` file in the `backend` directory:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/csTech
JWT_SECRET=a9f8e4b36c76b8e23f1d8a4b9c29a875cd34e2ab8a3f9f5cb76a81cbd9f1e3a6e3d42f7a82e7a9a6


```
- Adjust `MONGO_URI` if using a remote MongoDB instance.

### c. Start the Backend Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```
- The backend will run on [http://localhost:5000](http://localhost:5000)

---

## 3. Frontend Setup

### a. Install Dependencies
```bash
cd ../frontend
npm install
```

### b. Start the Frontend
```bash
npm start
```
- The frontend will run on [http://localhost:3000](http://localhost:3000)

---

## 4. Usage
- Register/login as an admin.
- use credential
- username: maliknumair21@gmail.com
- passowrd: admin123
- Add agents.
- Upload CSV/XLSX/XLS files with columns: `FirstName`, `Phone`, `Notes`.
- Distribute and view leads per agent.

---

## 5. Troubleshooting
- **MongoDB not running:** Ensure your MongoDB service is started.
- **Port conflicts:** Change `PORT` in `.env` or frontend's `package.json` proxy if needed.
- **CORS issues:** Both servers must run on localhost or configure CORS in `backend/server.js`.

---

## 6. Project Structure
```
CSTech/
  backend/
    controllers/ models/ routes/ ...
  frontend/
    src/ components/ ...
  sample_leads.csv
```

---

## 7. Dependencies
- **Backend:** express, mongoose, dotenv, cors, multer, bcryptjs, jsonwebtoken, csv-parser, xlsx
- **Frontend:** react, axios

---

## 8. Contact
For issues, contact the project maintainer or open an issue in the repository.
