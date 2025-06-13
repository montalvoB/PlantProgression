import { useState } from "react";

type AddPlantModalProps = {
  isModalOpen: boolean;
  closeModal: () => void;
  addPlant: (newPlant: {
    name: string;
    species: string; // Changed from type
    image: File | null;
    description: string;
  }) => void;
};

function AddPlantModal({
  isModalOpen,
  closeModal,
  addPlant,
}: AddPlantModalProps) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState(""); // Changed from type
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(""); // Added for error display

  const handleSubmit = () => {
    if (name && species && image && description) {
      setError("");
      addPlant({ name, species, image, description });
      setName("");
      setSpecies("");
      setImage(null);
      setDescription("");
      closeModal();
    } else {
      setError("All fields are required");
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add New Plant</h2>
        <input
          type="text"
          placeholder="Plant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Plant Species" // Updated placeholder
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button onClick={handleSubmit}>Add Plant</button>
        <button onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
}

export default AddPlantModal;
