// Small circular replay control for the scripted panel animations. Rendered
// absolutely in the bottom-right corner of a (relative) panel; clicking it
// restarts that panel's animation (the parent remounts the scripted player).
type ReplayButtonProps = {
  onClick: () => void;
  className?: string;
};

const ReplayButton = ({ onClick, className }: ReplayButtonProps) => (
  <button
    type="button"
    aria-label="Replay animation"
    title="Replay"
    onClick={onClick}
    className={`absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
      className ?? ''
    }`}
  >
    {/* Counter-clockwise rotate arrow (replay). */}
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  </button>
);

export default ReplayButton;
