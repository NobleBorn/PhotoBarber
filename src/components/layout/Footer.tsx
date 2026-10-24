import Brand from "./Brand";

export default function Footer() {
  return (
    <footer className="site-container mt-12 border-t border-line py-9">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
        <div id="about"><Brand /></div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-6 text-sm text-muted">
          <a href="https://www.linkedin.com/in/mojtaba-alizade-6b0a8b294" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)" className="hover:text-primary">LinkedIn</a>
          <a href="https://github.com/NobleBorn" target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)" className="hover:text-primary">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
