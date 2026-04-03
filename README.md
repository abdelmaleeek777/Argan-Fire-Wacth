# 🔥 Argan Fire Watch

A comprehensive fire monitoring and alert system designed to protect forest areas through real-time alerts, sensor management, and emergency response coordination.

## 📋 Overview

Argan Fire Watch is a web-based platform that enables cooperatives, firefighters, and administrators to:
- **Monitor** forest zones with IoT sensors
- **Detect** fire alerts in real-time
- **Respond** quickly with coordinated firefighting efforts
- **Track** incidents and manage resources

## 🎯 Key Features

- **Multi-role Authentication**: Admin, Firefighters (POMPIER/CHEF_EQUIPE), and Cooperatives
- **Zone Management**: Create, edit, and delete forest zones with geographic mapping
- **Sensor Monitoring**: Track sensor performance and real-time environmental data
- **Alert System**: Real-time fire alerts with WhatsApp notifications via Twilio
- **Dashboard Analytics**: Role-specific dashboards with statistics and visualizations
- **Email Verification**: Secure cooperative registration with email confirmation
- **Interactive Maps**: Leaflet-based mapping with zone drawing and heat maps
- **JWT Authentication**: Secure token-based API endpoints

## 🏗️ Tech Stack

### Backend
- **Framework**: Flask 3.1.0
- **Language**: Python
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Notifications**: Twilio (WhatsApp)
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.3.1
- **Styling**: Tailwind CSS 4.2.1
- **Maps**: Leaflet 1.9.4 + React-Leaflet
- **Charts**: Recharts 3.8.1
- **Animations**: Framer Motion 12.35.1
- **HTTP Client**: Axios 1.13.6
- **Router**: React Router DOM 7.13.1
- **Real-time**: Socket.IO 4.8.3

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 5.7+
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/argan-fire-watch.git
   cd argan-fire-watch/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```env
   DATABASE_URL=mysql://user:password@localhost/argan_fire_watch_db
   JWT_SECRET=your-secret-key
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_WHATSAPP_NUMBER=+1234567890
   ```

5. **Setup database**
   ```bash
   mysql -u root -p < database/argan_fire_watch_db.sql
   ```

6. **Run backend**
   ```bash
   python run.py
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Application runs on `http://localhost:5175`

4. **Build for production**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/Scripts/activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Both services are CORS-enabled and configured to work together:
- **Frontend** → http://localhost:5175
- **Backend API** → http://localhost:5000/api
- **Database** → localhost:3306

## 📁 Project Structure

```
argan-fire-watch/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app initialization
│   │   ├── config.py             # Database configuration
│   │   ├── models/               # Database models
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth_routes.py    # Authentication
│   │   │   ├── zones.py          # Zone management
│   │   │   ├── sensors.py        # Sensor data
│   │   │   ├── alerts.py         # Alert system
│   │   │   └── dashboard.py      # Dashboard data
│   │   └── services/             # (Placeholder - not currently used)
│   ├── database/
│   │   └── argan_fire_watch_db.sql
│   ├── notification.py           # Twilio notifications
│   ├── run.py                    # Entry point
│   ├── requirements.txt
│   └── tests/                    # (Placeholder - not currently used)
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── cooperative/      # Coop dashboard components
│   │   │   ├── pompier/          # Firefighter components
│   │   │   └── admin/            # Admin components
│   │   ├── pages/                # Page components
│   │   │   ├── public/           # Login, Register
│   │   │   ├── cooperative/      # Coop pages
│   │   │   ├── pompier/          # Firefighter pages
│   │   │   └── admin/            # Admin pages
│   │   ├── utils/                # Utilities
│   │   │   └── axiosInstance.js  # API client
│   │   ├── App.jsx               # Main app
│   │   └── main.jsx
│   ├── public/                   # Static assets
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 👥 User Roles

| Role | Access | Features |
|------|--------|----------|
| **ADMIN** | Full platform | Manage cooperatives, users, view all alerts |
| **POMPIER/FIREFIGHTER** | Fire response | View assigned zones, respond to alerts |
| **CHEF_EQUIPE** | Team lead | Manage firefighter teams, coordinate response |
| **COOPERATIVE** | Zone owner | Create zones, manage sensors, view own alerts |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Cooperative registration
- `POST /api/auth/verify-email` - Email verification

### Zones
- `GET /api/zones` - List cooperative zones
- `POST /api/zones` - Create new zone
- `DELETE /api/zones/:id` - Delete zone

### Sensors
- `GET /api/sensors` - List sensors
- `POST /api/sensors` - Add sensor
- `GET /api/sensors/:id/data` - Get sensor readings

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts/stats` - Alert statistics

### Dashboard
- `GET /api/dashboard/stats` - Summary statistics
- `GET /api/dashboard/geojson` - Map data

## ⚙️ Configuration

### Database Connection
Edit `backend/app/config.py`:
```python
DATABASE_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your-password',
    'database': 'argan_fire_watch_db'
}
```

### Twilio Setup
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get your credentials and WhatsApp number
3. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_WHATSAPP_NUMBER=+212xxxxxxxxx
   ```

## 🐛 Common Issues

### "Unknown column 'envoye' in 'where clause'"
Add the `envoye` column to the `alertes_utilisateurs` table:
```sql
ALTER TABLE alertes_utilisateurs
ADD COLUMN envoye BOOLEAN DEFAULT 0;
```

### CORS errors
Ensure both backend and frontend are running on configured ports (5000 and 5175)

### Database connection refused
Check MySQL is running and credentials in `.env` are correct

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Open a Pull Request

## 📝 Recent Updates (Mar 28, 2026)

- ✅ Fixed route path misalignment in API blueprints
- ✅ Fixed SQL query errors in alerts system
- ✅ Fixed JavaScript hoisting issues in frontend
- ✅ Added missing sensors route for cooperatives
- ✅ Improved zone creation and linking to cooperatives
- ✅ Enhanced error handling and user feedback

## 📦 Planned Features (Not Yet Implemented)

The following directories contain placeholder code for future features:
- `backend/app/services/` - AI propagation model, integrity verification, email service
- `backend/tests/` - Unit tests for planned features

These can be safely removed or used as a foundation when features are implemented.

## 🧹 Cleanup (Optional)

To remove placeholder code for unimplemented features:

```bash
# Remove unused directories
rm -rf backend/tests
rm -rf backend/app/services
```

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💻 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team

---

**Argan Fire Watch** - Protecting forests. Saving lives. 🌲🚒
