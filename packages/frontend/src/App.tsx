import { Routes, Route, useNavigate } from "react-router";
import Home from "./Home";
import Timeline from "./Timeline";
import { useState, useEffect } from "react";
import type { Plant } from "./types";
import { MainLayout } from "./MainLayout";
import { LoginPage } from "./LoginPage";
import { ValidRoutes } from "../../backend/src/shared/ValidRoutes";

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [error, setError] = useState("");

  function handleAuthSuccess(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    navigate(ValidRoutes.HOME);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    navigate(ValidRoutes.LOGIN);
  }

  if (error) {
    console.error("Error:", error);
  }

  useEffect(() => {
    if (!token) return;

    fetch("/api/plants", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          if (data.error === "Missing auth token") {
            logout();
            return;
          }
          throw new Error(data.error || "Failed to fetch plants");
        }
        return res.json();
      })
      .then((data) =>
        setPlants(
          data.map((plant: any) => ({
            id: plant._id,
            name: plant.name,
            type: plant.species,
            description: plant.description || "",
            images: [
              ...(plant.progress?.map((entry: any) => ({
                id: entry.id, // Map progress ID
                url: entry.image || "",
                date: entry.date,
                notes: entry.notes,
              })) || []),
              ...(plant.image
                ? [
                    {
                      url: plant.image,
                      date: plant.createdAt || new Date(0).toISOString(),
                      notes: "",
                    },
                  ]
                : []),
            ],
          }))
        )
      )
      .catch((err) => console.error("Failed to fetch plants", err));
  }, [token]);

  function addPlant(newPlant: {
    name: string;
    species: string;
    image: File | null;
    description: string;
  }) {
    if (
      !newPlant.image ||
      !newPlant.name ||
      !newPlant.species ||
      !newPlant.description
    ) {
      setError("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", newPlant.name);
    formData.append("species", newPlant.species);
    formData.append("description", newPlant.description);
    if (newPlant.image) {
      formData.append("image", newPlant.image);
    }

    fetch("/api/plants", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add plant");
        }
        return res.json();
      })
      .then((createdPlant) => {
        setPlants((prev) => [
          ...prev,
          {
            id: createdPlant._id,
            name: createdPlant.name,
            type: createdPlant.species,
            description: createdPlant.description || "",
            images: createdPlant.image
              ? [
                  {
                    url: createdPlant.image,
                    date: new Date(0).toISOString(),
                    notes: "",
                  },
                ]
              : [],
          },
        ]);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
        console.error("Failed to add plant", err);
      });
  }

  function deletePlant(id: string) {
    fetch(`/api/plants/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (res.ok) {
        setPlants((prev) => prev.filter((plant) => plant.id !== id));
      } else {
        console.error("Failed to delete plant");
      }
    });
  }

  function addProgressEntry(
    plantId: string,
    entry: { id: string; url: string; date: string; notes?: string }
  ) {
    setPlants((prev) =>
      prev.map((plant) =>
        plant.id === plantId
          ? {
              ...plant,
              images: [...plant.images, entry],
            }
          : plant
      )
    );
  }

  function updateProgressNotes(
    plantId: string,
    entryId: string,
    notes: string
  ) {
    setPlants((prev) =>
      prev.map((plant) =>
        plant.id === plantId
          ? {
              ...plant,
              images: plant.images.map((image) =>
                image.id === entryId
                  ? { ...image, notes: notes || undefined }
                  : image
              ),
            }
          : plant
      )
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route
          path={ValidRoutes.LOGIN}
          element={
            <LoginPage
              isRegistering={false}
              onAuthSuccess={handleAuthSuccess}
            />
          }
        />
        <Route
          path={ValidRoutes.REGISTER}
          element={
            <LoginPage isRegistering={true} onAuthSuccess={handleAuthSuccess} />
          }
        />
        <Route
          path="*"
          element={
            <LoginPage
              isRegistering={false}
              onAuthSuccess={handleAuthSuccess}
            />
          }
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path={ValidRoutes.HOME} element={<MainLayout logout={logout} />}>
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
          path={ValidRoutes.TIMELINE}
          element={
            <Timeline
              plants={plants}
              token={token!}
              addProgressEntry={addProgressEntry}
              updateProgressNotes={updateProgressNotes}
            />
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <Home plants={plants} addPlant={addPlant} deletePlant={deletePlant} />
        }
      />
    </Routes>
  );
}

export default App;
