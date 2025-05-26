type PlantCardProps = {
  id: string;
  name: string;
  type: string;
  image: string;
  description: string;
  deleteCard: (id: string) => void;
};

function PlantCard({ id, name, type, image, description, deleteCard }: PlantCardProps) {
  return (
    <div className="plant-card">
      <h2>{name}</h2>
      <p>Type: {type}</p>
      {image && <img src={image} alt={name} style={{ maxWidth: "200px" }} />}
      <p>{description}</p>
      <button onClick={() => deleteCard(id)}>Delete</button>
    </div>
  );
}

export default PlantCard;