// Preview canvas for the connectors experiment. Renders the Connectors panel
// centered on a neutral Rivet-styled backdrop so variants can be compared in
// isolation. Wired in src/main.ts at /experiments/connectors.
import Connectors from './Connectors';

const ConnectorsExperiment = () => {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
      <Connectors />
    </main>
  );
};

export default ConnectorsExperiment;
