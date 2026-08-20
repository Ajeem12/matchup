import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page">
      <h1 className="hero-title">
        Pass. Match.
        <br />
        Press first.
      </h1>
      <p className="hero-sub">
        Cards move clockwise around the table, one at a time. The instant someone completes four of
        a color, everyone races to the button — press order decides the points.
      </p>
      <div className="hero-mechanic">
        <span className="mechanic-chip">4–8 players</span>
        <span className="mechanic-chip">Clockwise passing</span>
        <span className="mechanic-chip">Server-timed scoring</span>
        <span className="mechanic-chip">Real-time via Socket.IO</span>
      </div>
      <div className="home-actions">
        <Link
          to="/create"
          className="btn-primary"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Create a room
        </Link>
        <Link
          to="/join"
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Join with a code
        </Link>
      </div>
    </div>
  );
}
