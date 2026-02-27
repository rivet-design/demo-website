const X_LINK = 'https://x.com/designrivet';
const DISCORD_LINK = 'https://discord.gg/Eqn9Fcpuh4';
const DOCS_LINK = 'https://docs.rivet.design/';
const RELEASES_LINK = 'https://docs.rivet.design/releases';
const EMAIL = 'sam@tryrivet.design';

const Footer = () => {
  return (
    <footer className="w-full border-t border-rivet-dark/5 py-12 mt-20">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
            <span className="font-sans font-bold text-xl tracking-tighter uppercase">Rivet</span>
          </div>
          <p className="type-body text-rivet-dark/50 max-w-xs">
            The visual editor built for design. Bridge the gap between your design and your codebase.
          </p>
          <span className="type-overline text-rivet-dark/30">
            © 2026 Rivet, Inc.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <span className="type-overline text-rivet-dark/40">Product</span>
            <div className="flex flex-col gap-3">
              <a href={DOCS_LINK} target="_blank" rel="noopener noreferrer" className="type-label text-rivet-dark/60 hover:text-primary transition-colors">Documentation</a>
              <a href={RELEASES_LINK} target="_blank" rel="noopener noreferrer" className="type-label text-rivet-dark/60 hover:text-primary transition-colors">Releases</a>
              <a href={`mailto:${EMAIL}`} className="type-label text-rivet-dark/60 hover:text-primary transition-colors">Support</a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="type-overline text-rivet-dark/40">Social</span>
            <div className="flex flex-col gap-3">
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="type-label text-rivet-dark/60 hover:text-primary transition-colors">Discord</a>
              <a href={X_LINK} target="_blank" rel="noopener noreferrer" className="type-label text-rivet-dark/60 hover:text-primary transition-colors">Twitter / X</a>
              <a href="https://github.com/Ironclad/rivet" target="_blank" rel="noopener noreferrer" className="type-label text-rivet-dark/60 hover:text-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
