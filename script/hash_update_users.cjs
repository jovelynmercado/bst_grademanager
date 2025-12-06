const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
(async () => {
  try {
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'grade_manager' });
    const [rows] = await conn.execute('SELECT id,email,temp_password FROM users');
    for (const u of rows) {
      const pw = u.temp_password || '';
      if (pw) {
        const hash = await bcrypt.hash(pw, 10);
        await conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, u.id]);
        console.log('Updated hash for', u.email);
      }
    }
    await conn.execute("UPDATE users SET email = 'admin@gmail.com' WHERE email = 'admin@example.com'");
    await conn.execute("UPDATE users SET email = 'student1@hcdc.edu.ph' WHERE email = 'student1@example.com'");
    console.log('Updated admin/student emails');
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
