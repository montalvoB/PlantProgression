import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface IAuthTokenPayload {
  username: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: IAuthTokenPayload;
  }
}

export function verifyAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.get("Authorization");
  const token = authHeader?.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    res.status(401).send({ error: "Missing auth token" });
    return;
  }

  jwt.verify(token, req.app.locals.JWT_SECRET as string, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).send({ error: "Invalid or expired token" });
    } else {
      req.user = decoded as IAuthTokenPayload;
      next();
    }
  });
}
