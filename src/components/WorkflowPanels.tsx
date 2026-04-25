const SECTION_BG = '#F0EFE9';
const R2_MEDIA_URL = 'https://pub-eed10ae7764348e2b0775fb6de2f56de.r2.dev';
const POSTER_SRC = '/images/rivet-demo@2x.png';
const VIDEO_SRC = `${R2_MEDIA_URL}/media/vid_landing.webm`;

const WorkflowPanels = () => {
  return (
    <div
      style={{
        background: SECTION_BG,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 -28px',
      }}
    >
      <img
        src={POSTER_SRC}
        alt="Rivet demo"
        className="block w-full sm:hidden"
      />
      <video
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Rivet demo"
        className="hidden w-full sm:block"
      />
    </div>
  );
};

export default WorkflowPanels;
