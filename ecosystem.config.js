module.exports = {
  apps: [
    {
      name: "udu-feeder", // Name of the application
      script: "deno", // Use the Deno executable
      args: "run --allow-net --allow-read --unstable-kv main.ts",
      env: {
        DENO_ENV: "production", // Set any environment variables here
      },
      autorestart: true, // Automatically restart on crashes
      instances: 1, // Number of instances to run
      max_memory_restart: "1G", // Max memory before restarting
    },
  ],
};
