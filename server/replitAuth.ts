import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

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

    // Simple dev login endpoint. Use seeded credentials from the SQL.
    // Admin: admin@gmail.com / admin123
    // Student: student1@hcdc.edu.ph / student123
    app.post("/api/login", async (req: any, res) => {
      try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

        // dev-only hardcoded checks (do not use in production)
        if (email === "admin@gmail.com" && password === "admin123") {
          const user = {
            claims: { sub: "dev-admin", email, first_name: "Site", last_name: "Admin" },
            access_token: null,
            refresh_token: null,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
          };
          req.login(user, (err: any) => {
            if (err) return res.status(500).json({ message: "Login failed" });
            return res.json({ ok: true, role: "admin" });
          });
          return;
        }

        if (email.endsWith("@hcdc.edu.ph") && password === "student123") {
          const user = {
            claims: { sub: "dev-student", email, first_name: "John", last_name: "Student" },
            access_token: null,
            refresh_token: null,
            expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
          };
          req.login(user, (err: any) => {
            if (err) return res.status(500).json({ message: "Login failed" });
            return res.json({ ok: true, role: "student" });
          });
          return;
        }

        return res.status(401).json({ message: "Invalid credentials" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Login error" });
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
