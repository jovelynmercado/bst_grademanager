const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const sql = fs.readFileSync(require('path').join(__dirname, '..', 'grade_manager_mysql.sql'), 'utf8');
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '' });
    console.log('Connected to MySQL');

    await conn.execute("CREATE DATABASE IF NOT EXISTS grade_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    await conn.changeUser({ database: 'grade_manager' });

    // Split statements safely by semicolon followed by newline
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(s => s.length);

    for (const statement of statements) {
      // skip obvious non-table statements that may conflict
      const stmtLower = statement.trim().toLowerCase();
      if (stmtLower.startsWith('create database') || stmtLower.startsWith('use ')) continue;
      try {
        await conn.query(statement);
      } catch (err) {
        // log and continue
        console.error('Statement error:', err.message);
      }
    }

    console.log('Import finished');
    await conn.end();
  } catch (err) {
    console.error('Import error:', err.message);
    process.exit(1);
  }
})();
