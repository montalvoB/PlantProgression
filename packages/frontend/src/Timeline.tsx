import { useParams } from "react-router";
import { useState, useEffect } from "react";
import type { Plant } from "./types";

type TimelineProps = {
  plants: Plant[];
  token: string;
  addProgressEntry: (
    plantId: string,
    entry: {
      id: string;
      url: string;
      date: string;
      notes?: string;
    }
  ) => void;
  updateProgressNotes: (
    plantId: string,
    entryId: string,
    notes: string
  ) => void;
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

  useEffect(() => {
    console.log("Timeline plantId:", plantId, "Plants:", plants.map(p => ({ id: p.id, name: p.name })));
    if (!plant) {
      console.log("Plant not found for plantId:", plantId);
    } else {
      console.log("Found plant:", plant.name);
    }
  }, [plantId, plants, plant]);

  if (!plant || !plantId) {
    console.log("Plant or plantId missing:", { plantId, plant });
    return <div>Plant not found</div>;
  }

  const handleAddImage = async () => {
    if (!image) {
      setError("Please select an image");
      console.log("No image selected");
      return;
    }
    setError("");
    setIsPending(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("notes", notes);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const putUrl = `${API_URL}/plants/${plantId}/progress`;
    console.log("PUT URL:", putUrl);

    try {
      const response = await fetch(putUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log("PUT error:", errorData);
        throw new Error(errorData.error || "Failed to upload image");
      }
      const data = await response.json();
      console.log("Progress added:", data);
      addProgressEntry(plantId, {
        id: data.id,
        url: data.image,
        date: new Date().toISOString(),
        notes,
      });
      setImage(null);
      setNotes("");
    } catch (error: any) {
      setError(error.message || "Failed to upload image");
      console.error("Error uploading image:", error);
    } finally {
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
        console.log("PATCH error:", data);
        return;
      }

      updateProgressNotes(plant.id, editingEntryId, editNotes);
      setEditingEntryId(null);
      setEditNotes("");
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Error updating notes:", err);
    } finally {
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
          disabled={isPending || !image}
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
              (b, a) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
                    {error && <p className="error">{error}</p>}
                  </div>
                ) : (
                  image.notes &&
                  image.notes.trim() && (
                    <div className="notes-container">
                      <p className="timeline-notes">{image.notes}</p>
                      {image.id && (
                        <button
                          className="edit-button"
                          onClick={() => handleEditNotes(image.id || "", image.notes)}
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