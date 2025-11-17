# Deployment & Collaboration Guide

## 🚀 Hosting on Render (Free)

### Step 1: Deploy to Render

1. **Go to Render:** https://render.com
2. **Sign up** with your GitHub account (animeshf)
3. **Click "New +"** → **"Web Service"**
4. **Connect your repository:**
   - Click "Configure account" to give Render access to your GitHub
   - Select `nyc-subway-tracker`
5. **Configure the service:**
   - **Name:** nyc-subway-tracker
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt && python generate_stations.py`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
6. **Click "Create Web Service"**

**That's it!** Render will:
- Build your app (~2-3 minutes)
- Generate station data automatically
- Deploy it with a URL like: `https://nyc-subway-tracker.onrender.com`

### Notes:
- Free tier sleeps after 15 mins of inactivity (first load takes ~30 seconds)
- Upgrade to paid ($7/mo) for always-on + custom domain
- Auto-deploys on every push to `main` branch

---

## 👥 Collaboration Pipeline

### Branch Protection Setup

1. **Go to your GitHub repo:** https://github.com/animeshf/nyc-subway-tracker
2. **Settings** → **Branches**
3. **Add branch protection rule:**
   - Branch name pattern: `main`
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require status checks to pass (optional, for CI/CD)
   - ✅ Require conversation resolution before merging
   - Save changes

### Workflow for Collaborators

**For Contributors:**

1. **Fork or Clone** the repository
   ```bash
   git clone https://github.com/animeshf/nyc-subway-tracker.git
   cd nyc-subway-tracker
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and test locally**
   ```bash
   python app.py
   # Test at http://localhost:5000
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to GitHub
   - Click "Compare & pull request"
   - Fill in description using the PR template
   - Assign reviewers

**For You (Maintainer):**

1. **Review PRs**
   - Check code quality
   - Test locally if needed
   - Request changes or approve

2. **Merge approved PRs**
   - Click "Merge pull request"
   - Delete branch after merge

3. **Render auto-deploys**
   - New changes go live automatically!

---

## 🔄 Optional: GitHub Actions CI/CD

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run tests
        run: |
          python -c "import app; print('✅ App imports successfully')"
```

This runs automated checks on every PR!

---

## 📊 Collaboration Best Practices

### For All Contributors:

1. **Always pull latest main before creating a branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/new-feature
   ```

2. **Keep PRs small and focused**
   - One feature per PR
   - Clear commit messages

3. **Test thoroughly**
   - Test on different browsers
   - Test on mobile
   - Check for errors in console

4. **Write good PR descriptions**
   - What changed?
   - Why?
   - Screenshots if UI changes

### For Maintainer:

1. **Review regularly**
   - Respond to PRs within 24-48 hours
   - Give constructive feedback

2. **Keep main branch stable**
   - Only merge tested code
   - Fix critical bugs ASAP

3. **Communicate**
   - Use GitHub Discussions for ideas
   - Close stale issues/PRs
   - Thank contributors!

---

## 🔗 Quick Links

- **Live App:** https://nyc-subway-tracker.onrender.com (after deployment)
- **GitHub Repo:** https://github.com/animeshf/nyc-subway-tracker
- **Render Dashboard:** https://dashboard.render.com

---

## 📝 Adding Collaborators

1. **Settings** → **Collaborators**
2. **Add people**
3. Enter GitHub username
4. Set permissions:
   - **Write:** Can push to branches, create PRs
   - **Maintain:** Can manage issues/PRs
   - **Admin:** Full access (be careful!)

For most contributors, **Write** access is enough (they create PRs, you approve).

---

## 🆘 Troubleshooting

**Render build fails:**
- Check build logs in Render dashboard
- Ensure `stations.json` generates correctly
- Verify all dependencies in `requirements.txt`

**Auto-deploy not working:**
- Check Render is connected to your GitHub repo
- Verify the branch is set to `main`
- Check deploy logs for errors

**Collaboration issues:**
- Make sure branch protection is enabled
- Check collaborator permissions
- Ensure PR template is filled out

---

Need help? Open an issue on GitHub!

