// Preview canvas for the connector-visuals experiment. Renders the abstract
// visual centered on a neutral Rivet backdrop, the way it would sit in a
// landing-page section. Wired in src/main.ts at /experiments/connectors-visuals.
import ConnectorVisual from './ConnectorVisual';

const ConnectorVisualExperiment = () => {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-secondary px-6 py-16">
      <ConnectorVisual />
    </main>
  );
};

export default ConnectorVisualExperiment;
