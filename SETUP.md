# NETHRA — Setup Guide
## Full self-hosted: MySQL + Express + JWT + Gemini AI

---

## Stack
- Frontend: React 18 + Vite + Tailwind
- Backend: Node.js + Express + JWT auth
- Database: MySQL (Hostinger included)
- AI: Google Gemini 1.5 Flash (free tier)
- SMS: Fast2SMS (optional)

---

## Step 1: MySQL Database on Hostinger

1. hPanel → **Databases** → **MySQL Databases**
2. Create database — note the name
3. Create a user with a strong password
4. Assign user to database → **All Privileges**
5. Note: host = `localhost`, port = `3306`

---

## Step 2: Run the Schema

1. hPanel → **Databases** → **phpMyAdmin**
2. Select your database on the left
3. Click the **SQL** tab
4. Open `database/nethra_mysql_schema.sql` from this project
5. Paste entire contents → click **Go**

This creates all tables and a default super admin:
- Email: `admin@nethra.app`
- Password: `Admin@1234`

**Change the password immediately after first login.**

---

## Step 3: Fill in .env

Open `.env` and update:

```
DB_HOST=localhost
DB_NAME=your_database_name       ← from Step 1
DB_USER=your_database_user       ← from Step 1
DB_PASSWORD=your_database_password

JWT_SECRET=make-this-long-and-random-at-least-32-characters

GEMINI_API_KEY=AIzaSyBO_6z97mQAwYg7zj8pkToJaK0JHOFQCW8
FRONTEND_URL=https://nethra.ideafirst.in
```

---

## Step 4: Create Subdomain on Hostinger

1. hPanel → **Domains** → **Subdomains**
2. Create: `nethra.ideafirst.in`
3. Document root: `public_html/nethra`

---

## Step 5: Deploy Node.js API Server on Hostinger

1. hPanel → **Websites** → **Node.js**  
   (or search "Node.js" in hPanel)
2. **Create Application**:

| Field | Value |
|---|---|
| Node.js version | 18 or 20 |
| Application root | `nethra-api` |
| Application startup file | `server/index.js` |
| Application URL | `nethra.ideafirst.in/api` |

3. Upload these files to `~/nethra-api/`:
   - `server/index.js`
   - `server/db.js`
   - `server/auth.js`
   - `package.json`
   - `.env`

4. In Node.js panel → click **Run NPM Install**
5. Click **Start**

---

## Step 6: Build and Upload Frontend

On your Windows machine, in PowerShell inside the project:

```powershell
# Set production API URL first
# Open .env and set:
# VITE_API_URL=https://nethra.ideafirst.in

npm run build
```

Upload everything inside `dist/` to `public_html/nethra/` via:
- hPanel → File Manager, or
- FTP (FileZilla)

---

## Step 7: Add .htaccess

Inside `public_html/nethra/`, create `.htaccess`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

---

## Step 8: First Login

Open `https://nethra.ideafirst.in` in your browser.

Login with:
- Email: `admin@nethra.app`
- Password: `Admin@1234`

Go to **Super Admin** → create politician profiles and assign users.

---

## Local Development

**Terminal 1 — API server:**
```powershell
npm run server
```

**Terminal 2 — Frontend:**
```powershell
npm run dev
```

Open `http://localhost:5173`

Make sure `.env` has `VITE_API_URL=` (empty) for local dev so the Vite proxy handles `/api` calls.

---

## Default Login
| Field | Value |
|---|---|
| Email | admin@nethra.app |
| Password | Admin@1234 |

Change this immediately after first login via Super Admin → Users.

