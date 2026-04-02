module.exports = {
  apps: [{
    name: 'thoughtfirst-api',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      MISTRAL_API_KEY: '6z87gOvz3u4TTVmLqTIUbP3QoL2c7GOT',
      AI_PROVIDER: 'mistral',
      MISTRAL_MODEL: 'mistral-large-latest'
    }
  }]
};
