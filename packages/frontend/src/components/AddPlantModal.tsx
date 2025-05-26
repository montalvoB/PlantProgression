import { useState } from "react";

type AddPlantModalProps = {
  isModalOpen: boolean;
  closeModal: () => void;
  addPlant: (newPlant: {
    name: string;
    type: string;
    image: string;
    description: string;
  }) => void;
};

function AddPlantModal({ isModalOpen, closeModal, addPlant }: AddPlantModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (name && type && image && description) {
      addPlant({ name, type, image, description });
      setName("");
      setType("");
      setImage("");
      setDescription("");
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
          placeholder="Plant Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={handleSubmit}>Add Plant</button>
        <button onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
}

export default AddPlantModal;