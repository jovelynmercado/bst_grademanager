const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
(async()=>{
  try{
    const conn = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'',database:'grade_manager'});
    const [rows]=await conn.execute('SELECT email,password_hash FROM users WHERE email in (?,?)',['admin@gmail.com','student1@hcdc.edu.ph']);
    for(const u of rows){
      const ok = await bcrypt.compare(u.email.includes('admin')? 'admin123':'student123', u.password_hash);
      console.log(u.email, 'password valid?', ok);
    }
    await conn.end();
  }catch(e){console.error(e.message);process.exit(1);} 
})();
