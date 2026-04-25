module.exports = {
    apps: [ {
        name: "animal-style-backend",
        script: "./dist/server.js",
        env_production: {
            NODE_ENV: "production"
        }
    } ]
}