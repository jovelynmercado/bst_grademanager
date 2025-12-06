(async () => {
  try {
    const fetch = globalThis.fetch;
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin123' }),
      credentials: 'include',
    });
    console.log('LOGIN STATUS', loginRes.status);
    console.log('LOGIN HEADERS:');
    for (const [k, v] of loginRes.headers.entries()) console.log(k + ': ' + v);
    const loginText = await loginRes.text();
    console.log('LOGIN BODY:', loginText);

    const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    console.log('SET-COOKIE:', setCookie);

    let cookieHeader = setCookie || '';
    const userRes = await fetch('http://localhost:5000/api/auth/user', {
      method: 'GET',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      credentials: 'include',
    });
    console.log('USER STATUS', userRes.status);
    try {
      const userJson = await userRes.json();
      console.log('USER BODY', userJson);
    } catch (e) {
      console.log('USER BODY TEXT:', await userRes.text());
    }
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
