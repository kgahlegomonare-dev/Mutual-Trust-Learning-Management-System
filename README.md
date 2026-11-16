# Mutual Trust — Custom Learning Management System (LMS)

Centralized learning management system and automated early-warning engine built for the **Kutlwanong Center for Mathematics, Science, and Technology**.

Mutual Trust is a custom-built Learning Management System (LMS) and real-time organizational governance platform tailored to help the Kutlwanong Centre for Maths, Science and Technology centralize student data, monitor academic performance, and proactively intervene across its nationwide learning centres.



---

# HOW TO RUN AND SEE A DEMO OF MUTUAL TRUST

## LOGIN CREDENTIALS
                                 USERNAME                                    PASSWORD                     
  
ADMIN:                         12345678901                                   123456

CENTER MANAGER 1:              2694275586                                    123456

TEACHER 1:                     603262135                                     123456

TEACHER2:                      658714018                                     123456

LEARNER 1:                     35032555                                      123456

## Project Structure

```text
.
├── frontend/             # Client-side web application (React / Vite)
├── backend/              # Javascript Backend services & .NET 10 Clean Architecture API
│   └── dotnetAPI-ver-2/
│       └── thirdYearProject/
│           ├── TYP.Domain/
│           ├── TYP.Application/
│           ├── TYP.Infrastructure/
│           └── TYP.api/
└── docker-compose.yml    # Container orchestration for Docker deployment
```

---

## Prerequisites

Ensure you have the following tools installed on your system:

* **Node.js** (v18 or higher) & **npm**
* **.NET 10 SDK** (and **Visual Studio 2022/2026** if running the backend via IDE)
* **Docker Desktop** (if running via Docker Compose)

---

## Installation

To ensure all dependencies are properly installed across the repository, run `npm install` in the root folder as well as individually inside the `frontend` and `backend` directories.

### 1. Root Directory
From the parent folder containing `frontend` and `backend`:
```bash
npm install
```

### 2. Frontend Directory
```bash
cd frontend
npm install
```

### 3. Backend Directory
```bash
cd backend
npm install
```

---

## Running the Application

### 1. Running the Frontend
From the `frontend` directory, start the development server:
```bash
cd frontend
npm run dev
```

### 2. Running the .NET Backend

Choose **either** Visual Studio or Docker to run the backend:

#### Option A: Using Visual Studio
1. Open the solution file (`.sln`) inside `backend/dotnetAPI-ver-2/thirdYearProject/` in **Visual Studio**.
2. Set `TYP.api` as the **Startup Project**.
3. Press **F5** (or click **Run**) to build and launch the API.

#### Option B: Using Docker
Ensure **Docker Desktop** is running, then build and start the services using the `docker-compose.yml` file:
```bash
docker-compose up --build
```
*(Run `docker-compose down` when you are finished to stop and remove the containers).*
