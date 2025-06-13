import { useParams } from "react-router";
import { useState } from "react";
import type { Plant } from "./types";

type TimelineProps = {
  plants: Plant[];
  token: string;
  addProgressEntry: (
    plantId: string,
    entry: {
      id: string; // Added for progress entry ID
      url: string;
      date: string;
      notes?: string;
    }
  ) => void;
  updateProgressNotes: (
    plantId: string,
    entryId: string,
    notes: string
  ) => void; // Added for updating notes
};

function Timeline({ plants, token, addProgressEntry, updateProgressNotes }: TimelineProps) {
  const { plantId } = useParams<{ plantId: string }>();
  const [image, setImage] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const plant = plants.find((p) => p.id === plantId);

  if (!plant) {
    console.log("Plant not found for plantId:", plantId);
    return <div>Plant not found</div>;
  }

  const handleAddImage = async () => {
    if (!image) {
      setError("Image is required");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("notes", notes);

      const response = await fetch(`/api/plants/${plantId}/progress`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add image");
        setIsPending(false);
        return;
      }

      const data = await response.json();
      const newEntry = {
        id: data.id, // Use backend-provided progress ID
        url: data.image || `/uploads/${image.name}`,
        date: new Date().toISOString(),
        notes: notes || undefined,
      };
      addProgressEntry(plant.id, newEntry);
      setImage(null);
      setNotes("");
      setIsPending(false);
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Error uploading image:", err);
      setIsPending(false);
    }
  };

  const handleEditNotes = (entryId: string, currentNotes: string | undefined) => {
    setEditingEntryId(entryId);
    setEditNotes(currentNotes || "");
  };

  const handleSaveNotes = async () => {
    if (!editingEntryId) return;

    setError("");
    setIsPending(true);

    try {
      const response = await fetch(`/api/plants/${plantId}/progress/${editingEntryId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: editNotes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update notes");
        setIsPending(false);
        return;
      }

      updateProgressNotes(plant.id, editingEntryId, editNotes);
      setEditingEntryId(null);
      setEditNotes("");
      setIsPending(false);
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Error updating notes:", err);
      setIsPending(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditNotes("");
    setError("");
  };

  return (
    <div className="timeline">
      <h1 className="plant-card">{plant.name} Timeline</h1>
      <div className="timeline-input">
        <label htmlFor="image-upload">Upload Image</label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
          disabled={isPending}
        />
        <textarea
          placeholder="Add notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isPending}
        />
        {error && <p className="error">{error}</p>}
        <button
          className="timeline-button"
          onClick={handleAddImage}
          aria-label="Add new plant image"
          disabled={isPending}
        >
          {isPending ? "Uploading..." : "Add Image"}
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
              <div key={image.id || index} className="timeline-item">
                <img
                  src={image.url}
                  alt={`${plant.name} at ${image.date}`}
                  className="timeline-image"
                />
                <div className="timeline-dot"></div>
                <p className="timeline-date">
                  {new Date(image.date).toLocaleString()}
                </p>
                {editingEntryId === image.id ? (
                  <div className="edit-notes">
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Edit notes"
                      disabled={isPending}
                    />
                    <div className="edit-buttons">
                      <button
                        className="timeline-button"
                        onClick={handleSaveNotes}
                        disabled={isPending}
                      >
                        Save
                      </button>
                      <button
                        className="cancel-button"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  image.notes &&
                  image.notes.trim() && (
                    <div className="notes-container">
                      <p className="timeline-notes">{image.notes}</p>
                      {image.id && (
                        <button
                          className="edit-button"
                          onClick={() => handleEditNotes(image.id!, image.notes)}
                          disabled={isPending}
                          aria-label={`Edit notes for image from ${image.date}`}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Timeline;