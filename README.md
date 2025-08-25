# 🎓 Education Management System

A comprehensive full-stack application for managing educational institutions with role-based access, real-time notifications, and integrated communication systems.

## 🚀 Features

### 🔐 Authentication & Roles
- **Student** (@std.com) - Access to sessions, syllabus, tests, and feedback
- **Tutor** (@tut.com) - Session management, attendance, and student communication
- **Admin** (@adm.com) - Institution management and oversight
- **Super Admin** (@adm.com) - System maintenance and global settings

### 📱 Notifications
- WhatsApp integration for session alerts and reminders
- In-app notification center
- Email notifications for critical events
- Environment-based configuration (dev/prod)

### 📊 Dashboards
- **Student**: Upcoming sessions, syllabus, test results, payment history
- **Tutor**: Session management, attendance, earnings, availability
- **Admin**: Student/tutor management, organization analytics, reports
- **Super Admin**: System-wide configuration and maintenance

## 🛠️ Tech Stack

- **Frontend**: React + Material-UI + Framer Motion
- **Backend**: Node.js + Express + JWT
- **Database**: MySQL
- **WhatsApp API**: Twilio
- **Authentication**: JWT-based with role management
- **Deployment**: Docker + environment configuration

## 🚀 Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd education-management-system
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Install dependencies**:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

4. **Database setup**:
   ```bash
   # Start MySQL and run migrations
   cd backend && npm run db:migrate
   npm run db:seed
   ```

5. **Run the application**:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm start
   ```

## 🌍 Environment Configuration

- **dev**: Skip payments, WhatsApp alerts enabled
- **prod**: Full payment integration, all features enabled

## 📁 Project Structure

```
education-management-system/
├── backend/                 # Node.js + Express API
├── frontend/               # React application
├── database/               # SQL scripts and migrations
├── docker/                 # Docker configuration
└── docs/                   # Documentation
```

## 🔧 Configuration

See `.env.example` for all required environment variables including:
- Database credentials
- JWT secrets
- WhatsApp API keys
- Email configuration
- Environment settings

## 📱 Demo Accounts

- **Student**: student@std.com / password123
- **Tutor**: tutor@tut.com / password123
- **Admin**: admin@adm.com / password123
- **Super Admin**: superadmin@adm.com / password123

## 🚀 Deployment

The application is Docker-ready with separate configurations for development and production environments.