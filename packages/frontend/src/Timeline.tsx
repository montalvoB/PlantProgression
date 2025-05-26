import { useParams } from "react-router";
import { useState } from "react";
import type { Plant } from "./types";

type TimelineProps = {
  plants: Plant[];
  addPlantImage: (plantId: string, imageUrl: string, notes?: string) => void;
};

function Timeline({ plants, addPlantImage }: TimelineProps) {
  const { plantId } = useParams<{ plantId: string }>();
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [error, setError] = useState("");

  const plant = plants.find((p) => p.id === plantId);

  if (!plant) {
    console.log("Plant not found for plantId:", plantId);
    return <div>Plant not found</div>;
  }

  console.log("Plant images:", plant.images);

  const handleAddImage = () => {
    if (!newImageUrl) {
      setError("Image URL is required");
      return;
    }

    // Validate image URL by attempting to load it
    const img = new Image();
    img.src = newImageUrl;

    img.onload = () => {
      setError("");
      console.log("Adding image with notes:", newNotes);
      addPlantImage(plant.id, newImageUrl, newNotes);
      setNewImageUrl("");
      setNewNotes("");
    };

    img.onerror = () => {
      setError("Invalid image URL. Please provide a valid image.");
    };
  };

  return (
    <div className="timeline">
      <h1 className="plant-card">{plant.name} Timeline</h1>
      <div className="timeline-input">
        <input
          type="text"
          placeholder="Image URL"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
        />
        <textarea
          placeholder="Add notes (optional)"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button
          className="timeline-button"
          onClick={handleAddImage}
          aria-label="Add new plant image"
        >
          Add Image
        </button>
      </div>
      <div className="timeline-container">
        <div className="timeline-line"></div>
        {plant.images.length === 0 ? (
          <p>No images yet</p>
        ) : (
          plant.images
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((image, index) => (
              <div key={index} className="timeline-item">
                <img
                  src={image.url}
                  alt={`${plant.name} at ${image.date}`}
                  className="timeline-image"
                />
                <div className="timeline-dot"></div>
                <p className="timeline-date">
                  {new Date(image.date).toLocaleString()}
                </p>
                {image.notes && image.notes.trim() && (
                  <p className="timeline-notes">{image.notes}</p>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Timeline;
