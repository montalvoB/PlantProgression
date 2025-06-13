import express from "express";
import { CredentialsProvider } from "../CredentialsProvider";

import jwt from "jsonwebtoken";

interface IAuthTokenPayload {
  username: string;
}

function generateAuthToken(
  username: string,
  jwtSecret: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const payload: IAuthTokenPayload = { username };
    jwt.sign(payload, jwtSecret, { expiresIn: "1d" }, (err, token) => {
      if (err || !token) reject(err);
      else resolve(token);
    });
  });
}

export function registerAuthRoutes(
  app: express.Application,
  authProvider: CredentialsProvider
) {
  app.post("/auth/register", async (req, res) => {
    const { username, password } = req.body;

    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({
        error: "Bad request",
        message: "Missing username or password",
      });
      return;
    }

    try {
      const success = await authProvider.registerUser(username, password);
      if (!success) {
        res.status(409).json({
          error: "Username already taken",
          message: "Please choose a different username",
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign({ username }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });

      res.status(201).json({ token });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;

    // Case 1: Missing credentials
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).send({
        error: "Bad request",
        message: "Missing username or password",
      });
      return;
    }

    try {
      const isValid = await authProvider.verifyPassword(username, password);

      // Case 2: Invalid credentials
      if (!isValid) {
        res.status(401).send({
          error: "Invalid credentials",
          message: "Incorrect username or password",
        });
        return;
      }

      // Case 3: Valid credentials, generate token
      const jwtSecret = req.app.locals.JWT_SECRET;
      const token = await generateAuthToken(username, jwtSecret);

      res.status(200).send({ token });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });
}
