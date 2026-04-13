module.exports = {
  apps: [{
    name: 'thoughtfirst-api',
    script: 'server/index.js',
    cwd: '/root/nethra-thought',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
};
