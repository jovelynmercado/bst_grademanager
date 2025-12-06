import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@127.0.0.1:3306/grade_manager';

async function main() {
  const pool = mysql.createPool(DATABASE_URL);

  const [rows] = await pool.query("SELECT id, temp_password FROM users WHERE temp_password IS NOT NULL AND (password_hash IS NULL OR password_hash = '')");
  const users = rows;
  if (!users || users.length === 0) {
    console.log('No seeded users with temp_password found.');
    await pool.end();
    return;
  }

  for (const u of users) {
    try {
      const hash = bcrypt.hashSync(u.temp_password, 10);
      await pool.execute('UPDATE users SET password_hash = ?, temp_password = NULL WHERE id = ?', [hash, u.id]);
      console.log(`Hashed password for user ${u.id}`);
    } catch (err) {
      console.error('Error hashing user', u.id, err);
    }
  }

  await pool.end();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
