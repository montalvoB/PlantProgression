import { Collection, Db, MongoClient, ObjectId } from "mongodb";

interface ProgressEntry {
  id: string;
  date: Date;
  heightCm?: number;
  notes: string;
  image?: string;
}

interface PlantDocument {
  _id: ObjectId;
  name: string;
  species: string;
  image: string;
  authorId: string;
  description: string;
  progress: ProgressEntry[];
}

export class PlantProvider {
  private db: Db;
  private plantCollection: Collection<PlantDocument>;

  constructor(mongoClient: MongoClient) {
    this.db = mongoClient.db(); // uses the default DB
    this.plantCollection = this.db.collection<PlantDocument>("plants");
  }

  async createPlant(plant: Omit<PlantDocument, "_id">): Promise<string> {
    const result = await this.plantCollection.insertOne(plant as any);
    return result.insertedId.toString(); // Return the inserted ID
  }

  async getAllPlants(
    authorId: string,
    name?: string
  ): Promise<PlantDocument[]> {
    const query: any = { authorId };
    if (name) {
      query.name = { $regex: new RegExp(name, "i") }; // case-insensitive match
    }
    return this.plantCollection.find(query).toArray();
  }

  async getPlantById(plantId: string): Promise<PlantDocument | null> {
    return this.plantCollection.findOne({ _id: new ObjectId(plantId) });
  }

  async updateProgressNotes(
    plantId: string,
    progressId: string,
    newNotes: string
  ): Promise<boolean> {
    const result = await this.plantCollection.updateOne(
      {
        _id: new ObjectId(plantId),
        "progress.id": progressId,
      },
      {
        $set: {
          "progress.$.notes": newNotes,
        },
      }
    );

    return result.modifiedCount > 0;
  }

  async addProgressEntry(plantId: string, entry: ProgressEntry): Promise<void> {
    await this.plantCollection.updateOne(
      { _id: new ObjectId(plantId) },
      { $push: { progress: entry } }
    );
  }

  async updatePlantName(plantId: string, newName: string): Promise<number> {
    const result = await this.plantCollection.updateOne(
      { _id: new ObjectId(plantId) },
      { $set: { name: newName } }
    );
    return result.matchedCount;
  }

  async deletePlant(plantId: string): Promise<boolean> {
    const result = await this.plantCollection.deleteOne({
      _id: new ObjectId(plantId),
    });
    return result.deletedCount === 1;
  }

  async deleteProgressEntry(
    plantId: string,
    progressId: string
  ): Promise<boolean> {
    const result = await this.plantCollection.updateOne(
      { _id: new ObjectId(plantId) },
      { $pull: { progress: { id: progressId } } }
    );
    return result.modifiedCount > 0;
  }

  async updatePlantDetails(
    plantId: string,
    details: Partial<Omit<PlantDocument, "_id" | "authorId" | "progress">>
  ): Promise<boolean> {
    const updateFields: any = {};
    if (details.name !== undefined) updateFields.name = details.name;
    if (details.species !== undefined) updateFields.species = details.species;
    if (details.image !== undefined) updateFields.image = details.image;

    const result = await this.plantCollection.updateOne(
      { _id: new ObjectId(plantId) },
      { $set: updateFields }
    );

    return result.modifiedCount > 0;
  }
}
