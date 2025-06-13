import React, { useState } from "react";
import { Link } from "react-router";
import { ValidRoutes } from "../../backend/src/shared/ValidRoutes";

type LoginPageProps = {
  isRegistering: boolean;
  onAuthSuccess: (token: string) => void;
};

export function LoginPage({ isRegistering, onAuthSuccess }: LoginPageProps) {
  const usernameInputId = React.useId();
  const passwordInputId = React.useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    setIsPending(true);

    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        setErrorMessage("Unexpected server response.");
        setIsPending(false);
        return;
      }

      if (!response.ok) {
        setErrorMessage(data?.error || "Request failed. Please try again.");
        setIsPending(false);
        return;
      }

      const token = data?.token;
      if (typeof token === "string") {
        onAuthSuccess(token);
      } else {
        setErrorMessage("Invalid server response (no token)");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again later.");
      console.error("Error during submission:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="login-page">
      <h2>{isRegistering ? "Register a new account" : "Login"}</h2>

      <form className="login-page-form" onSubmit={handleSubmit}>
        <label htmlFor={usernameInputId}>Username</label>
        <input
          id={usernameInputId}
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isPending}
          autoFocus
        />

        <label htmlFor={passwordInputId}>Password</label>
        <input
          id={passwordInputId}
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
        />

        <input
          type="submit"
          value={isRegistering ? "Register" : "Login"}
          disabled={isPending}
        />
      </form>

      {errorMessage && (
        <p role="alert" aria-live="assertive" className="error">
          {errorMessage}
        </p>
      )}

      <p>
        {isRegistering ? (
          <>
            Have an account? <Link to={ValidRoutes.LOGIN}>Login here</Link>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <Link to={ValidRoutes.REGISTER}>Register here</Link>
          </>
        )}
      </p>
    </div>
  );
}
