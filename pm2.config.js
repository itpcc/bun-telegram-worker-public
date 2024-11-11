module.exports = {
	name: "bun-telegram-worker", // Name of your application
	script: "src/index.ts", // Entry point of your application
	interpreter: "/root/.bun/bin/bun", // Path to the Bun interpreter
    watch: '.',
 	output: '/var/log/projects/bun-telegram-worker.log'
};
