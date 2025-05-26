import { Link } from "react-router";
import PlantCard from "./components/PlantCard";
import AddPlantModal from "./components/AddPlantModal";
import { useState } from "react";
import type { Plant } from "./types";

type HomeProps = {
  plants: Plant[];
  addPlant: (newPlant: {
    name: string;
    type: string;
    image: string;
    description: string;
  }) => void;
  deletePlant: (id: string) => void;
};

function Home({ plants, addPlant, deletePlant }: HomeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plantCards = plants.map((plant) => {
    const latestImage =
      plant.images.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.url || "";

    return (
      <div key={plant.id} className="plant-card-container">
        <PlantCard
          id={plant.id}
          name={plant.name}
          type={plant.type}
          image={latestImage}
          description={plant.description}
          deleteCard={deletePlant}
        />
        <Link to={`/timeline/${plant.id}`} className="timeline-button">
          View Timeline
        </Link>
      </div>
    );
  });

  return (
    <main>
      <img src="/images/plant.png" alt="Plant" className="add-logo" />
      <button onClick={() => setIsModalOpen(true)} className="add">
        Add Plant
      </button>
      <AddPlantModal
        isModalOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        addPlant={addPlant}
      />
      <div className="plant-list">{plantCards}</div>
    </main>
  );
}

export default Home;
