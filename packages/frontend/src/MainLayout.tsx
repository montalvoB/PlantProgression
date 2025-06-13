import { Outlet, Link } from "react-router";

type MainLayoutProps = {
  logout: () => void;
};

export function MainLayout({ logout }: MainLayoutProps) {
  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <img src="/images/logo.png" alt="" className="logo" />
        <nav>
          <Link to="/">Home</Link>
        </nav>

        {/* Logout button */}
        <button className={"logout-button"} onClick={logout}>
          Logout
        </button>
      </header>

      <main>
        {/* Outlet renders nested route components */}
        <Outlet />
      </main>
    </div>
  );
}
