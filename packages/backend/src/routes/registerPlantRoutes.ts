import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { PlantProvider } from "../PlantProvider";
import {
  imageMiddlewareFactory,
  handleImageFileErrors,
} from "../middleware/imageUploadMiddleware";
import { verifyAuthToken } from "../middleware/verifyAuthToken";
import { nanoid } from "nanoid";

export function registerPlantRoutes(
  app: express.Application,
  plantProvider: PlantProvider
) {
  app.get(
    "/api/plants",
    verifyAuthToken,
    async (req: Request, res: Response) => {
      const name = req.query.name?.toString();
      const username = req.user?.username;

      if (!username) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      try {
        const plants = await plantProvider.getAllPlants(username, name);
        res.json(plants);
      } catch (error) {
        console.error("Failed to fetch plants", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  app.post(
    "/api/plants",
    verifyAuthToken,
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response) => {
      const file = req.file;
      const name = req.body?.name;
      const species = req.body?.species;
      const description = req.body?.description;
      const username = req.user?.username;

      if (!file || !name || !username || !species) {
        res
          .status(400)
          .json({
            error:
              "Missing required fields: name, species, and image are required",
          });
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
    async (req: Request, res: Response) => {
      const plantId = req.params.id;
      const notes = req.body?.notes || "";
      const username = req.user?.username;
      const file = req.file;

      if (!ObjectId.isValid(plantId)) {
        res.status(404).json({ error: "Invalid plant ID" });
        return;
      }

      if (!file) {
        res.status(400).json({ error: "Image is required" });
        return;
      }

      const image = `/uploads/${file.filename}`;
      const progressId = nanoid();

      try {
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
        }

        if (plant.authorId !== username) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        await plantProvider.addProgressEntry(plantId, {
          id: progressId,
          date: new Date(),
          heightCm: 0, // Default to 0 since optional
          notes,
          image,
        });

        res.status(201).json({ id: progressId, image });
      } catch (error) {
        console.error("Failed to add progress", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  app.patch(
    "/api/plants/:plantId/progress/:progressId",
    verifyAuthToken,
    async (req: Request, res: Response) => {
      const { plantId, progressId } = req.params;
      const { notes } = req.body;
      const username = req.user?.username;

      if (!ObjectId.isValid(plantId)) {
        res.status(400).json({ error: "Invalid plant ID" });
        return;
      }
      if (typeof notes !== "string") {
        res.status(400).json({ error: "Invalid notes" });
        return;
      }

      try {
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
        }
        if (plant.authorId !== username) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        const result = await plantProvider.updateProgressNotes(
          plantId,
          progressId,
          notes
        );
        if (!result) {
          res.status(404).json({ error: "Progress entry not found" });
          return;
        }

        res.status(204).send();
      } catch (err) {
        console.error("Error updating progress notes", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  // Other routes unchanged
  app.delete(
    "/api/plants/:plantId",
    verifyAuthToken,
    async (req: Request, res: Response) => {
      const { plantId } = req.params;
      const username = req.user?.username;

      if (!ObjectId.isValid(plantId)) {
        res.status(400).json({ error: "Invalid plant ID" });
        return;
      }

      try {
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
        }
        if (plant.authorId !== username) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        const deleted = await plantProvider.deletePlant(plantId);
        if (!deleted) {
          res.status(500).json({ error: "Failed to delete plant" });
          return;
        }

        res.status(204).send();
      } catch (err) {
        console.error("Error deleting plant", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  app.delete(
    "/api/plants/:plantId/progress/:progressId",
    verifyAuthToken,
    async (req: Request, res: Response) => {
      const { plantId, progressId } = req.params;
      const username = req.user?.username;

      if (!ObjectId.isValid(plantId)) {
        res.status(400).json({ error: "Invalid plant ID" });
        return;
      }

      try {
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
        }
        if (plant.authorId !== username) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        const deleted = await plantProvider.deleteProgressEntry(
          plantId,
          progressId
        );
        if (!deleted) {
          res.status(404).json({ error: "Progress entry not found" });
          return;
        }

        res.status(204).send();
      } catch (err) {
        console.error("Error deleting progress entry", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  app.patch(
    "/api/plants/:plantId",
    verifyAuthToken,
    imageMiddlewareFactory.single("image"),
    handleImageFileErrors,
    async (req: Request, res: Response) => {
      const { plantId } = req.params;
      const username = req.user?.username;
      const { name, species } = req.body;
      const file = req.file;
      const image = file ? `/uploads/${file.filename}` : undefined;

      if (!ObjectId.isValid(plantId)) {
        res.status(400).json({ error: "Invalid plant ID" });
        return;
      }

      try {
        const plant = await plantProvider.getPlantById(plantId);
        if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
        }
        if (plant.authorId !== username) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        const updated = await plantProvider.updatePlantDetails(plantId, {
          name,
          species,
          image,
        });

        if (!updated) {
          res.status(400).json({ error: "No changes were made" });
          return;
        }

        res.status(204).send();
      } catch (err) {
        console.error("Error updating plant details", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  app.get(
    "/api/plants/:id",
    verifyAuthToken,
    async (req: Request, res: Response) => {
      const plantId = req.params.id;
      const username = req.user?.username;

      if (!ObjectId.isValid(plantId)) {
        res.status(400).json({ error: "Invalid plant ID" });
        return;
      }
      if (!username) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      try {
        const plant = await plantProvider.getPlantById(plantId);

        if (!plant) {
          res.status(404).json({ error: "Plant not found" });
          return;
        }

        if (plant.authorId !== username) {
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        res.json(plant);
      } catch (err) {
        console.error("Failed to fetch plant by ID", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );
}
