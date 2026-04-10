#!/bin/bash
# ThoughtFirst — Fresh Install Script
# Run as root on the VPS
# Usage: bash scripts/fresh_install.sh

set -e
echo "============================================"
echo " ThoughtFirst Fresh Install"
echo "============================================"

REPO="https://vishnudantu:YOUR_GITHUB_PAT@github.com/vishnudantu/nethra-thought.git"
# Get PAT from: github.com → Settings → Developer Settings → Personal Access Tokens → Classic → repo scope
INSTALL_DIR="/var/www/thoughtfirst-api"
FRONTEND_DIR="/var/www/thoughtfirst-frontend"
DB_NAME="thoughtfirst"
DB_USER="thoughtfirst"
DB_PASS='Q4Mz2s7Y[bAs777'

# Step 1: Backup existing
echo ""
echo "→ Step 1: Taking backup..."
if [ -d "$INSTALL_DIR" ]; then
  BACKUP="/root/backup-$(date +%Y%m%d-%H%M)"
  cp -r $INSTALL_DIR $BACKUP
  echo "  Backup saved to $BACKUP"
else
  echo "  No existing install to backup"
fi

# Step 2: Stop PM2
echo ""
echo "→ Step 2: Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Step 3: Clone fresh
echo ""
echo "→ Step 3: Cloning fresh from GitHub..."
rm -rf $INSTALL_DIR
mkdir -p $INSTALL_DIR
git clone $REPO $INSTALL_DIR
echo "  Cloned successfully"

# Step 4: Install dependencies
echo ""
echo "→ Step 4: Installing dependencies..."
cd $INSTALL_DIR
npm install --production=false
echo "  Dependencies installed"

# Step 5: Run database migrations
echo ""
echo "→ Step 5: Running database migrations..."
for sql_file in migrations/*.sql; do
  if [ -f "$sql_file" ]; then
    echo "  Running $sql_file..."
    mysql -u $DB_USER -p"$DB_PASS" $DB_NAME < "$sql_file" 2>/dev/null || echo "  (migration may have already run)"
  fi
done

# Step 6: Seed politician profiles
echo ""
echo "→ Step 6: Seeding politician profiles..."
if [ -f "scripts/seed_politicians.sql" ]; then
  mysql -u $DB_USER -p"$DB_PASS" $DB_NAME < scripts/seed_politicians.sql
  echo "  Politician profiles seeded"
fi

# Step 7: Build frontend
echo ""
echo "→ Step 7: Building frontend..."
npm run build
mkdir -p $FRONTEND_DIR
cp -r dist/. $FRONTEND_DIR/
echo "  Frontend built and deployed to $FRONTEND_DIR"

# Step 8: Start PM2 from correct directory
echo ""
echo "→ Step 8: Starting server..."
pm2 start server/index.js --name thoughtfirst-api --interpreter node
pm2 save
pm2 startup 2>/dev/null || true

# Step 9: Verify
echo ""
echo "→ Step 9: Verifying..."
sleep 4
HEALTH=$(curl -s http://localhost:3002/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"ok"'; then
  echo "  ✅ Server is healthy"
else
  echo "  ⚠️  Health check failed — checking logs..."
  pm2 logs thoughtfirst-api --lines 15 --nostream
fi

LOGIN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@thoughtfirst.in","password":"Admin@1234"}' 2>/dev/null)
if echo "$LOGIN" | grep -q '"token"'; then
  echo "  ✅ Login working"
else
  echo "  ⚠️  Login check failed"
fi

echo ""
echo "============================================"
echo " Fresh Install Complete!"
echo "============================================"
echo ""
echo " Demo Accounts:"
echo "  Super Admin:  admin@thoughtfirst.in / Admin@1234"
echo "  Jagan:        jagan@ysrcp.com / Demo@1234"
echo "  Naidu:        cbn@tdp.com / Demo@1234"  
echo "  Pawan Kalyan: pawankalyan@js.com / Demo@1234"
echo "  Sana Sathish: sathish@sana.com / YPUpZ@\$MwTK6"
echo ""
echo " Live URL: https://thoughtfirst.in"
echo ""
