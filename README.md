# Argan Fire Watch

Argan Fire Watch is a premium wildfire monitoring platform designed to protect Morocco’s argan ecosystem.

The platform connects cooperatives, firefighters, and administrators through a unified monitoring system powered by sensors, live alerts, maps, and risk analysis.

---

# Overview

Argan Fire Watch was built to:

- Monitor argan zones in real time
- Detect fire risks early using connected sensors
- Coordinate between cooperatives and firefighters
- Visualize alerts, incidents, and protected zones
- Help preserve Morocco’s argan ecosystem

The application includes three main dashboards:

- Admin Dashboard
- Cooperative Dashboard
- Firefighter Dashboard

Each role has its own interface and permissions while sharing the same premium visual identity.

---

# Main Features

## Admin Dashboard

The admin portal allows administrators to manage the entire platform.

- View all cooperatives
- Approve or reject cooperative requests
- Manage users and sensors
- Monitor alerts and incidents
- View live maps and statistics
- Access logs and reports

## Cooperative Dashboard

The cooperative portal is used by local cooperatives to monitor their argan zones.

- View assigned argan zones
- Monitor sensors in real time
- View alerts affecting their area
- Access heat maps
- Manage profile and cooperative information

## Firefighter Dashboard

The firefighter portal acts as a tactical command center.

- Receive live fire alerts
- View active incidents
- Access operational maps

---

# Tech Stack

**Frontend:**

- React 18
- Tailwind CSS
- Framer Motion
- GSAP + ScrollTrigger
- Recharts
- Axios
- Lucide React
- React Leaflet

**Backend:**

- Python 3.x
- Flask / Connexion
- MySQL
- JWT Authentication
- Twilio API (WhatsApp/SMS Monitoring)

---

# Design System

The platform uses a custom “Argan Fire Watch” design language inspired by the Moroccan argan forest.

**Main Colors:**

- **Background**: `#F3F0E8`
- **Surface**: `#FAF8F4`
- **Argan Green**: `#4E6B4A`
- **Muted Green**: `#75836F`
- **Argan Gold**: `#B88A44`
- **Clay Accent**: `#B56C4D`
- **Dark Text**: `#1F2A22`

**Typography:**

- Clash Display

---

# Project Structure

```txt
frontend/
├── src/
│   ├── components/      # Reusable UI elements
│   ├── layouts/         # Role-based layouts
│   ├── pages/
│   │   ├── admin/       # Administrator views
│   │   ├── cooperative/ # Cooperative views
│   │   ├── pompier/     # Firefighter views
│   │   └── auth/        # Login and Registration
│   ├── services/        # API integration
│   └── App.jsx          # Route management
│
backend/
├── app/
│   ├── routes/          # API Controllers
│   ├── models/          # Database interaction
│   └── config.py        # Environment configuration
├── database/            # SQL Migrations and Seeds
└── run.py               # Main entry point
```

---

# Installation

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd Argan-Fire-Wacth
```

## 2. Install dependencies

**Frontend:**

```bash
cd frontend
npm install
```

**Backend:**

```bash
cd backend
pip install -r requirements.txt
```

---



# Run the Project

**Backend:**

```bash
cd backend
python run.py
```

**Frontend:**

```bash
cd frontend
npm run dev
```

# Team

### Core Development Team

- **HAMDA Abdelmalek**
  - Frontend development
  - Backend development
  - Full platform redesign
  - UI/UX and visual identity
  - [LinkedIn](https://www.linkedin.com/in/abdelmalek-hamda/)

- **GHAZAF Hajar**
  - Frontend development
  - [LinkedIn](https://www.linkedin.com/in/hajar-ghazaf-755131358/)

- **HASSAN Assmaa**
  - Backend development
  - Twilio integration
  - [LinkedIn](https://www.linkedin.com/in/assmaa-hassan-639315248/)

### Red Team (Audit / Attack Simulation)

- **EL BARAKA Rim**
  - [LinkedIn](https://www.linkedin.com/in/rim-el-baraka-494670343/)

- **EL KHESSOUANI Ilyass**
  - [LinkedIn](https://www.linkedin.com/in/ilyass-el-khessouani-4751352a7/)

### Blue Team (Configuration / Defense)

- **EL-IBRAHYMY El Mehdi**
  - [LinkedIn](https://www.linkedin.com/in/el-mehdi-el-ibrahymy-32515b2b6/)

- **FAJRI Rania**
  - [LinkedIn](https://www.linkedin.com/in/raniafajri/)

### QA Engineer (Testing)

- **GOURMIJE Ferdaousse**
  - [LinkedIn](https://www.linkedin.com/in/ferdaousse-gourmije-0708533bb/)

- **HADAD Haytam**
  - [LinkedIn](https://www.linkedin.com/in/haytam-hadad-037a6132b/)

---

_Preserving the heritage of the dry landscape through innovation._
