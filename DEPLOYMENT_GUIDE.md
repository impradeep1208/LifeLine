# Deploy LifeLine to Render

## Quick Deployment Steps

### 1. Create Render Account
- Go to [render.com](https://render.com) and sign up with your GitHub account

### 2. Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Name: `lifeline-db`
3. Database: `ero_db`
4. User: `ero_user`
5. Region: Choose closest to you
6. Plan: **Free**
7. Click "Create Database"
8. **Copy the Internal Database URL** (you'll need this)

### 3. Deploy Web Service
1. Click "New +" → "Web Service"
2. Connect repository: `impradeep1208/LifeLine`
3. Configure:
   - **Name**: `lifeline-app`
   - **Region**: Same as your database
   - **Branch**: `master`
   - **Root Directory**: Leave empty
   - **Runtime**: `Java`
   - **Build Command**: 
     ```
     cd backend && mvn clean package -DskipTests
     ```
   - **Start Command**: 
     ```
     java -Dserver.port=$PORT -Dspring.profiles.active=prod -jar backend/target/emergency-response-optimizer-1.0.0.jar
     ```

### 4. Add Environment Variables
In the "Environment" section, add:
- `DATABASE_URL`: Paste your PostgreSQL Internal Database URL
- `SPRING_PROFILES_ACTIVE`: `prod`

### 5. Deploy
- Click "Create Web Service"
- Wait 5-10 minutes for build and deployment
- Your app will be live at: `https://lifeline-app.onrender.com`

## Important Notes
- Free tier: App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Database has 90-day retention on free tier

## Your Live URLs
- Application: `https://[your-service-name].onrender.com`
- Direct to dashboard: `https://[your-service-name].onrender.com/dashboard.html`
