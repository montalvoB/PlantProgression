import { Routes, Route } from "react-router";
import Home from "./Home";
import Timeline from "./Timeline";
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import type { Plant } from "./types";
import { MainLayout } from "./MainLayout";

const ROSE_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv1t7ZOBF5i3SQBYyFMKm05rpL3Sd3Yny0QA&s";
const TULIP_URL =
  "https://www.whiteflowerfarm.com/mas_assets/cache/image/9/4/e/a/38122.Jpg";
const DAISY_URL =
  "https://silverfallsseed.com/wp-content/uploads/2016/01/shasta-daisy-tower-2021-22-e1683315437305.jpg";

const initialPlants: Plant[] = [
  {
    id: "plant-0",
    name: "Rose",
    type: "flower",
    images: [{ url: ROSE_URL, date: "2025-05-23T00:00:00Z" }],
    description: "A beautiful rose",
  },
  {
    id: "plant-1",
    name: "Tulip",
    type: "flower",
    images: [{ url: TULIP_URL, date: "2025-05-23T00:00:00Z" }],
    description: "A bright tulip",
  },
  {
    id: "plant-2",
    name: "Daisy",
    type: "flower",
    images: [{ url: DAISY_URL, date: "2025-05-23T00:00:00Z" }],
    description: "Nice daisies",
  },
];

function App() {
  const [plants, setPlants] = useState<Plant[]>(initialPlants);

  useEffect(() => {
    console.log("Plants state updated:", plants);
  }, [plants]);

  function addPlant(newPlant: {
    name: string;
    type: string;
    image: string;
    description: string;
  }) {
    if (
      !newPlant.image ||
      !newPlant.name ||
      !newPlant.type ||
      !newPlant.description
    ) {
      console.error("All fields are required");
      return;
    }
    const plantToAdd: Plant = {
      id: `plant-${nanoid()}`,
      name: newPlant.name,
      type: newPlant.type,
      images: [{ url: newPlant.image, date: new Date().toISOString() }],
      description: newPlant.description,
    };
    setPlants((prev) => [...prev, plantToAdd]);
  }

  function deletePlant(id: string) {
    setPlants((prev) => prev.filter((plant) => plant.id !== id));
  }

  function addPlantImage(plantId: string, imageUrl: string, notes?: string) {
    if (!imageUrl) {
      console.error("Image URL is required");
      return;
    }
    setPlants((prev) =>
      prev.map((plant) =>
        plant.id === plantId
          ? {
              ...plant,
              images: [
                ...plant.images,
                { url: imageUrl, date: new Date().toISOString(), notes },
              ],
            }
          : plant
      )
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={
            <Home
              plants={plants}
              addPlant={addPlant}
              deletePlant={deletePlant}
            />
          }
        />
        <Route
          path="/timeline/:plantId"
          element={<Timeline plants={plants} addPlantImage={addPlantImage} />}
        />
      </Route>
    </Routes>
  );
}

export default App;