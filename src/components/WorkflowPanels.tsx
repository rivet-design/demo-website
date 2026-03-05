const SECTION_BG = '#F0EFE9';

const WorkflowPanels = () => {
  return (
    <div
      style={{
        background: SECTION_BG,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5vw',
      }}
    >
      <img
        src="/images/rivet-demo@2x.png"
        alt="Rivet demo"
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  );
};

export default WorkflowPanels;
