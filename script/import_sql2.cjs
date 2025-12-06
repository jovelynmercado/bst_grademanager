const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const sql = fs.readFileSync(require('path').join(__dirname, '..', 'grade_manager_mysql.sql'), 'utf8');
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', multipleStatements: true });
    console.log('Connected to MySQL (multipleStatements)');

    // Run the entire SQL file at once
    await conn.query(sql);

    console.log('Import finished');
    await conn.end();
  } catch (err) {
    console.error('Import error:', err.message);
    process.exit(1);
  }
})();
