# MongoDB Atlas Setup Guide

## Step 1: Create a Cluster

1. Go to https://cloud.mongodb.com/
2. Sign up or log in
3. Click "Build a Database"
4. Choose:
   - **Cluster Tier**: M10 (Shared RAM) for production, M0 (Free) for testing
   - **Cloud Provider**: AWS, GCP, or Azure (choose closest to your users)
   - **Region**: Select region closest to your API deployment

## Step 2: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses of your deployment

## Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and strong password
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your user's password
6. Replace `<dbname>` with `structural-ai`

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/structural-ai?retryWrites=true&w=majority
```

## Step 5: Add to Environment Variables

Add to your `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/structural-ai?retryWrites=true&w=majority
```

## Step 6: Configure for Production

For optimal production settings, add these connection options:

```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## Collections Created Automatically

The application will create these collections on first run:
- `users` - User accounts
- `apikeys` - API key tracking
- `usagelogs` - Usage tracking for billing
- `analysisresults` - Analysis results storage

## Indexes

The following indexes are created automatically:
- `users`: email (unique), apiKey (unique)
- `apikeys`: key (unique), isActive
- `usagelogs`: user, apiKey, createdAt, status
- `analysisresults`: user, createdAt, status

## Monitoring

Set up MongoDB Atlas monitoring:
1. Go to "Metrics" to monitor performance
2. Set up "Alerts" for:
   - High CPU usage
   - Connection pool exhaustion
   - Slow queries
3. Enable "Backup" for automated daily backups
