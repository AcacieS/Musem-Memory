# Verify the database
Seems this will show a browser with your database
```
npx prisma studio
```

Use bcrypt for hashing password
```
npm install bcrypt
```

We'll use express-session to manage login sessions and PostgreSQL to store them.
```
npm install express-session connect-pg-simple pg
```

What each package does:
- express-session: manages user sessions.
- connect-pg-simple: stores sessions in PostgreSQL instead of keeping them only in server memory.
- pg: lets the session store communicate with PostgreSQL.

Add a session secret
Open server/.env and add:
```
SESSION_SECRET="replace_this_with_a_long_random_secret"
```
To generate a random secret, run this in PowerShell:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```