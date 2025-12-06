import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const ENABLE_OIDC = !!process.env.REPL_ID;

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  if (!ENABLE_OIDC) {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000;
    app.set("trust proxy", 1);
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "dev-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false,
          maxAge: sessionTtl,
        },
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());

    // Simple serialization for dev mode
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Simple dev login endpoint. Query database for credentials and verify password hash.
    app.post("/api/login", async (req: any, res) => {
      let conn;
      try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

        // Query database for user by email using raw MySQL
        conn = await mysql.createConnection(process.env.DATABASE_URL!);
        const [rows] = await conn.execute(
          "SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = ?",
          [email]
        );
        
        if (!Array.isArray(rows) || rows.length === 0) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const dbUser = rows[0] as any;
        if (!dbUser.password_hash) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password hash
        const passwordValid = await bcrypt.compare(password, dbUser.password_hash);
        if (!passwordValid) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create session user
        const user = {
          claims: { 
            sub: dbUser.id, 
            email: dbUser.email, 
            first_name: dbUser.first_name || "", 
            last_name: dbUser.last_name || "",
            role: dbUser.role
          },
          access_token: null,
          refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        };
        req.login(user, (err: any) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          return res.json({ ok: true, role: dbUser.role });
        });
      } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login error" });
      } finally {
        if (conn) await conn.end();
      }
    });

    app.get("/api/logout", (req: any, res) => {
      req.logout?.(() => res.redirect("/"));
    });

    console.log("OIDC disabled: running in development auth fallback mode");
    return;
  }

  // OIDC / Replit setup
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!ENABLE_OIDC) {
    const user = req.user as any;
    if (!user || !user.claims || !user.claims.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const now = Math.floor(Date.now() / 1000);
    if (user.expires_at && now > user.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
