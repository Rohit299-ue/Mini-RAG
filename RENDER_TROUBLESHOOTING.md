# 🔧 Render Deployment Troubleshooting

## Common Issues & Solutions

### ❌ "Root directory 'backend' does not exist"

**Problem**: Render is looking for a `backend` folder, but your code is in the root.

**Solution**: Update your Render service settings:
1. Go to Render Dashboard → Your Service → Settings
2. Set **Root Directory** to: `.` (just a dot) or leave it empty
3. Redeploy

### ❌ "Invalid local resolve" or "No such file or directory"

**Problem**: Path resolution issues in build process.

**Solution**: 
1. Check your **Build Command** is: `npm install`
2. Check your **Start Command** is: `npm start`
3. Ensure **Environment** is set to: `Node`

### ❌ "Exit status 1" during build

**Problem**: Build process failing.

**Solutions**:
1. **Check Node.js version**: Render uses Node 18 by default
2. **Verify package.json**: Ensure all dependencies are listed
3. **Check build logs**: Look for specific error messages

### ❌ Service starts but health check fails

**Problem**: App starts but `/health` endpoint not responding.

**Solutions**:
1. **Check environment variables**: Ensure all required vars are set
2. **Verify database connection**: Check Supabase URL and key
3. **Check API keys**: Ensure OpenAI key is valid

## 🔧 Quick Fix Steps

### Step 1: Update Service Settings
```yaml
Root Directory: . 
Build Command: npm install
Start Command: npm start
Environment: Node
```

### Step 2: Verify Environment Variables
Required variables in Render dashboard:
```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=sk-proj-your_openai_key
COHERE_API_KEY=your_cohere_key
CORS_ORIGIN=https://your-netlify-app.netlify.app
API_KEY=your_secure_random_key
```

### Step 3: Manual Redeploy
1. Go to your service dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Monitor the build logs

## 🧪 Test After Fix

Once deployed successfully:

```bash
# Test health endpoint
curl https://your-service-name.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "openai": "connected",
    "cohere": "connected"
  }
}
```

## 📞 Still Having Issues?

1. **Check Render logs**: Dashboard → Your Service → Logs
2. **Verify repository**: Ensure latest code is pushed to GitHub
3. **Test locally**: Run `npm start` locally to verify it works
4. **Check dependencies**: Run `npm install` locally

## 💡 Pro Tips

- **Deploy in stages**: Get basic health check working first
- **Use Render's auto-deploy**: Pushes to main branch auto-deploy
- **Monitor resource usage**: Free tier has limitations
- **Set up alerts**: Get notified of deployment failures

---

🎯 **Most common fix**: Set Root Directory to `.` (dot) in Render settings!