require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const sql = await fs.readFile(schemaPath, "utf8");
    await connection.query(sql);
    console.log("Database schema created successfully.");
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exit(1);
});
