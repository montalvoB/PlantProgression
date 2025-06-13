import express, { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { PlantProvider } from "../PlantProvider";
import { imageMiddlewareFactory, handleImageFileErrors } from "../middleware/imageUploadMiddleware";
import { verifyAuthToken } from "../middleware/verifyAuthToken";

export function registerPlantRoutes(app: express.Application, plantProvider: PlantProvider) {
  app.get("/api/plants", verifyAuthToken, async (req: Request, res: Response, next: NextFunction) => {
    const name = req.query.name?.toString();
    const username = req.user?.username;

    console.log("GET /api/plants:", { name, username });

    if (!username) {
      console.log("No username provided");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const plants = await plantProvider.getAllPlants(username, name);
      console.log("Fetched plants:", plants.length);
      res.json(plants);
    } catch (error) {
      console.error("Failed to fetch plants:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post(
    "/api/plants",
    verifyAuthToken,
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      const file = req.file;
      const name = req.body?.name;
      const species = req.body?.species;
      const description = req.body?.description;
      const username = req.user?.username;

      console.log("POST /api/plants:", { name, species, description, username, file: !!file });

      if (!file || !name || !username || !species) {
        console.log("Missing required fields");
        res.status(400).json({ error: "Missing required fields: name, species, and image are required" });
        return;
      }

      const src = `/uploads/${file.filename}`;

      try {
        const newPlant = {
          name,
          species,
          image: src,
          authorId: username,
          description: description || "",
          progress: [],
        };
        await plantProvider.createPlant(newPlant);
        console.log("Created plant:", newPlant.name);
        res.status(201).json({ ...newPlant, _id: new ObjectId().toString() });
      } catch (err) {
        console.error("Failed to insert plant:", err);
        res.status(500).json({ error: "Could not save plant" });
      }
    }
  );

  app.put(
    "/api/plants/:id/progress",
    verifyAuthToken,
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      const plantId = req.params.id;
      const notes = req.body?.notes || "";
      const username = req.user?.username;
      const file = req.file;

      console.log("PUT /api/plants/:id/progress:", { plantId, username, notes, file: file?.filename });

      try {
        if (!ObjectId.isValid(plantId)) {
          console.log("Invalid plant ID:", plantId);
          res.status(404).json({ error: "Invalid plant ID" });
          return;
        }

        if (!file) {
          console.log("No file uploaded");
          res.status(400).json({ error: "Image is required" });
          return;
        }

        const image = `/uploads/${file.filename}`;
        console.log("Generating progress ID...");
        const { nanoid } = await import("nanoid");
        const progressId = nanoid();
        console.log("Generated progress ID:", progressId);

        console.log("Fetching plant:", plantId);
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          console.log("Plant not found for ID:", plantId);
          res.status(404).json({ error: "Plant not found" });
          return;
        }

        console.log("Checking ownership:", { plantAuthor: plant.authorId, username });
        if (plant.authorId !== username) {
          console.log("Forbidden: User", username, "does not own plant", plantId);
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        console.log("Adding progress entry:", { progressId, image, notes });
        await plantProvider.addProgressEntry(plantId, {
          id: progressId,
          date: new Date(),
          heightCm: 0,
          notes,
          image,
        });

        console.log("Progress entry added successfully");
        res.status(201).json({ id: progressId, image });
      } catch (error: any) {
        console.error("Failed to add progress:", {
          message: error.message,
          stack: error.stack,
          plantId,
          username,
        });
        res.status(500).json({ error: "Internal Server Error", message: error.message });
      }
    }
  );

  app.patch("/api/plants/:plantId/progress/:progressId", verifyAuthToken, async (req: Request, res: Response, next: NextFunction) => {
    const { plantId, progressId } = req.params;
    const { notes } = req.body;
    const username = req.user?.username;

    console.log("PATCH /api/plants/:plantId/progress/:progressId:", { plantId, progressId, notes, username });

    if (!ObjectId.isValid(plantId)) {
      console.log("Invalid plant ID:", plantId);
      res.status(400).json({ error: "Invalid plant ID" });
      return;
    }
    if (typeof notes !== "string") {
      console.log("Invalid notes:", notes);
      res.status(400).json({ error: "Invalid notes" });
      return;
    }

    try {
      const plant = await plantProvider.getPlantById(plantId);
      if (!plant) {
        console.log("Plant not found for ID:", plantId);
        res.status(404).json({ error: "Plant not found" });
        return;
      }
      if (plant.authorId !== username) {
        console.log("Forbidden: User", username, "does not own plant", plantId);
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const result = await plantProvider.updateProgressNotes(plantId, progressId, notes);
      if (!result) {
        console.log("Progress entry not found for ID:", progressId);
        res.status(404).json({ error: "Progress entry not found" });
        return;
      }

      console.log("Progress notes updated successfully");
      res.status(204).send();
    } catch (err) {
      console.error("Error updating progress notes:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/plants/:plantId", verifyAuthToken, async (req: Request, res: Response, next: NextFunction) => {
    const { plantId } = req.params;
    const username = req.user?.username;

    console.log("DELETE /api/plants/:plantId:", { plantId, username });

    if (!ObjectId.isValid(plantId)) {
      console.log("Invalid plant ID:", plantId);
      res.status(400).json({ error: "Invalid plant ID" });
      return;
    }

    try {
      const plant = await plantProvider.getPlantById(plantId);
      if (!plant) {
        console.log("Plant not found for ID:", plantId);
        res.status(404).json({ error: "Plant not found" });
        return;
      }
      if (plant.authorId !== username) {
        console.log("Forbidden: User", username, "does not own plant", plantId);
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const deleted = await plantProvider.deletePlant(plantId);
      if (!deleted) {
        console.log("Failed to delete plant:", plantId);
        res.status(500).json({ error: "Failed to delete plant" });
        return;
      }

      console.log("Plant deleted successfully");
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting plant:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/plants/:plantId/progress/:progressId", verifyAuthToken, async (req: Request, res: Response, next: NextFunction) => {
    const { plantId, progressId } = req.params;
    const username = req.user?.username;

    console.log("DELETE /api/plants/:plantId/progress/:progressId:", { plantId, progressId, username });

    if (!ObjectId.isValid(plantId)) {
      console.log("Invalid plant ID:", plantId);
      res.status(400).json({ error: "Invalid plant ID" });
      return;
    }

    try {
      const plant = await plantProvider.getPlantById(plantId);
      if (!plant) {
        console.log("Plant not found for ID:", plantId);
        res.status(404).json({ error: "Plant not found" });
        return;
      }
      if (plant.authorId !== username) {
        console.log("Forbidden: User", username, "does not own plant", plantId);
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const deleted = await plantProvider.deleteProgressEntry(plantId, progressId);
      if (!deleted) {
        console.log("Progress entry not found for ID:", progressId);
        res.status(404).json({ error: "Progress entry not found" });
        return;
      }

      console.log("Progress entry deleted successfully");
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting progress entry:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch(
    "/api/plants/:plantId",
    verifyAuthToken,
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response, next: NextFunction) => {
      const { plantId } = req.params;
      const username = req.user?.username;
      const { name, species } = req.body;
      const file = req.file;
      const image = file ? `/uploads/${file.filename}` : undefined;

      console.log("PATCH /api/plants/:plantId:", { plantId, username, name, species, file: !!file });

      if (!ObjectId.isValid(plantId)) {
        console.log("Invalid plant ID:", plantId);
        res.status(400).json({ error: "Invalid plant ID" });
        return;
      }

      try {
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          console.log("Plant not found for ID:", plantId);
          res.status(404).json({ error: "Plant not found" });
          return;
        }
        if (plant.authorId !== username) {
          console.log("Forbidden: User", username, "does not own plant", plantId);
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        const updated = await plantProvider.updatePlantDetails(plantId, {
          name,
          species,
          image,
        });

        if (!updated) {
          console.log("No changes made for plant:", plantId);
          res.status(400).json({ error: "No changes were made" });
          return;
        }

        console.log("Plant details updated successfully");
        res.status(204).send();
      } catch (err) {
        console.error("Error updating plant details:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  app.get("/api/plants/:id", verifyAuthToken, async (req: Request, res: Response, next: NextFunction) => {
    const plantId = req.params.id;
    const username = req.user?.username;

    console.log("GET /api/plants/:id:", { plantId, username });

    if (!ObjectId.isValid(plantId)) {
      console.log("Invalid plant ID:", plantId);
      res.status(400).json({ error: "Invalid plant ID" });
      return;
    }
    if (!username) {
      console.log("No username provided");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const plant = await plantProvider.getPlantById(plantId);

      if (!plant) {
        console.log("Plant not found for ID:", plantId);
        res.status(404).json({ error: "Plant not found" });
        return;
      }

      if (plant.authorId !== username) {
        console.log("Forbidden: User", username, "does not own plant", plantId);
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      console.log("Fetched plant:", plant.name);
      res.json(plant);
    } catch (err) {
      console.error("Failed to fetch plant by ID:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
}