import { Link } from "react-router";

function Header() {
    return (
        <header>
        <h1>
            <img src="images/logo.png" alt="" className="logo" />
            Plant Progression
        </h1>
        <nav>
            <Link to="/">Garden</Link>
            {/* <Link to="/timeline">Timeline</Link> */}
        </nav>
    </header>
    );
}

export default Header;