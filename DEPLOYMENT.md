# 🚀 Deployment Guide - Education Management System

This guide covers deploying the Education Management System to various environments.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MySQL 8.0+ (for local development)
- Git

## 🏠 Local Development Setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd education-management-system
```

### 2. Environment Configuration

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 3. Database Setup

```bash
# Start MySQL (if using Docker)
docker run -d \
  --name education_mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=education_management \
  -p 3306:3306 \
  mysql:8.0

# Or use existing MySQL instance
# Update backend/.env with your MySQL credentials
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Database Migration and Seeding

```bash
# Backend
cd backend
npm run db:migrate
npm run db:seed
```

### 6. Start Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🐳 Docker Deployment

### 1. Quick Start with Docker Compose

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### 2. Individual Service Deployment

```bash
# Build and start backend
docker build -t education-backend ./backend
docker run -d \
  --name education-backend \
  -p 5000:5000 \
  -e DB_HOST=your-mysql-host \
  -e DB_PASSWORD=your-password \
  education-backend

# Build and start frontend
docker build -t education-frontend ./frontend
docker run -d \
  --name education-frontend \
  -p 3000:3000 \
  -e REACT_APP_API_URL=http://your-api-url \
  education-frontend
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 Setup

```bash
# Launch EC2 instance (Ubuntu 20.04 LTS)
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# Clone repository
git clone <repository-url>
cd education-management-system
```

#### 2. Environment Configuration

```bash
# Create production environment file
cp docker/docker-compose.yml docker/docker-compose.prod.yml

# Edit production environment variables
nano docker/docker-compose.prod.yml
```

#### 3. Deploy

```bash
# Start production services
docker-compose -f docker/docker-compose.prod.yml up -d

# Check status
docker-compose -f docker/docker-compose.prod.yml ps
```

#### 4. Load Balancer Setup

```bash
# Create Application Load Balancer
# Configure target groups for backend (port 5000) and frontend (port 3000)
# Set up SSL certificates
```

### Google Cloud Platform (GCP)

#### 1. Compute Engine Setup

```bash
# Create VM instance
gcloud compute instances create education-app \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud

# Connect via SSH
gcloud compute ssh education-app --zone=us-central1-a
```

#### 2. Deploy Application

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Clone and deploy
git clone <repository-url>
cd education-management-system
docker-compose -f docker/docker-compose.yml up -d
```

### Azure Deployment

#### 1. Azure Container Instances

```bash
# Deploy backend
az container create \
  --resource-group your-rg \
  --name education-backend \
  --image your-registry/education-backend:latest \
  --ports 5000 \
  --environment-variables \
    DB_HOST=your-mysql-host \
    DB_PASSWORD=your-password

# Deploy frontend
az container create \
  --resource-group your-rg \
  --name education-frontend \
  --image your-registry/education-frontend:latest \
  --ports 3000 \
  --environment-variables \
    REACT_APP_API_URL=http://your-backend-url
```

## 🔐 Environment Variables

### Backend (.env)

```bash
# Core Configuration
NODE_ENV=production
ENVIRONMENT=prod
PORT=5000

# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=education_management
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DIALECT=mysql

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@education.com

# Payment Gateway
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Security
SESSION_SECRET=your-session-secret
BCRYPT_ROUNDS=12
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://your-api-url/api
REACT_APP_ENVIRONMENT=production
REACT_APP_WHATSAPP_ENABLED=true
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## 🗄️ Database Setup

### MySQL Configuration

```sql
-- Create database
CREATE DATABASE education_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'education_user'@'%' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON education_management.* TO 'education_user'@'%';
FLUSH PRIVILEGES;

-- Run schema
mysql -u education_user -p education_management < database/schema.sql
```

### Database Migration

```bash
# Run migrations
cd backend
npm run db:migrate

# Seed data (development only)
npm run db:seed
```

## 🔒 Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificate (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Configure nginx with SSL
sudo nano /etc/nginx/sites-available/education-app
```

### Firewall Configuration

```bash
# UFW firewall setup
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

## 📊 Monitoring and Logging

### Application Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor application logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Monitoring

```bash
# MySQL performance monitoring
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd education-management-system
            git pull origin main
            docker-compose -f docker/docker-compose.prod.yml up -d --build
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check MySQL service
sudo systemctl status mysql

# Check connection
mysql -u education_user -p -h your-host

# Verify environment variables
echo $DB_HOST
echo $DB_PASSWORD
```

#### 2. Port Already in Use

```bash
# Find process using port
sudo netstat -tulpn | grep :5000

# Kill process
sudo kill -9 <PID>
```

#### 3. Docker Container Issues

```bash
# Check container status
docker ps -a

# View container logs
docker logs education-backend

# Restart container
docker restart education-backend
```

#### 4. Memory Issues

```bash
# Check system resources
free -h
df -h

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📈 Performance Optimization

### Backend Optimization

```bash
# Enable PM2 for process management
npm install -g pm2
pm2 start server.js --name "education-backend"

# Enable clustering
pm2 start ecosystem.config.js
```

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_sessions_tutor_start ON sessions(tutor_id, start_time);
CREATE INDEX idx_attendance_session_student ON attendance(session_id, student_id);

-- Optimize queries
EXPLAIN SELECT * FROM sessions WHERE tutor_id = ? AND start_time > ?;
```

### Frontend Optimization

```bash
# Build optimization
npm run build

# Enable gzip compression in nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u education_user -p education_management > backup_$DATE.sql

# Automated backup with cron
0 2 * * * /path/to/backup-script.sh
```

### Application Backup

```bash
# Backup application files
tar -czf app-backup-$(date +%Y%m%d).tar.gz education-management-system/

# Backup Docker volumes
docker run --rm -v education_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 📞 Support

For deployment issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Check network connectivity
4. Review security group/firewall settings
5. Consult the troubleshooting section above

## 🎯 Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up SSL certificates
5. Configure load balancing
6. Set up logging aggregation
7. Implement health checks
8. Configure auto-scaling (if applicable)