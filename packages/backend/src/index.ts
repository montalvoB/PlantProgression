import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { connectMongo } from "./connectMongo";
import { PlantProvider } from "./PlantProvider";
import { registerPlantRoutes } from "./routes/registerPlantRoutes";
import { registerAuthRoutes } from "./routes/authRoutes";
import { CredentialsProvider } from "./CredentialsProvider";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const STATIC_DIR = process.env.STATIC_DIR || "public";
const IMAGE_UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR || path.join(STATIC_DIR, "uploads");

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET from environment");
}
app.locals.JWT_SECRET = JWT_SECRET;

// Middleware
app.use(express.json());
app.use(express.static(STATIC_DIR));
app.use("/uploads", express.static(IMAGE_UPLOAD_DIR));
app.use(cors({
  origin: ["http://localhost:5173", "https://bmonta02.csse.dev"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: true,
}));

// Mongo connection
const mongoClient = connectMongo();
const authProvider = new CredentialsProvider(mongoClient);
registerAuthRoutes(app, authProvider); // Unprotected routes

mongoClient.connect().then(() => {
  console.log("MongoDB connection established successfully.");

  const plantProvider = new PlantProvider(mongoClient);
  registerPlantRoutes(app, plantProvider);

  app.get("/api/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
  });

  app.get("*", async (req: Request, res: Response) => {
    res.sendFile(path.resolve(STATIC_DIR, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});
