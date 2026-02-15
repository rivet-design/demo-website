import { Heading2, Body, Code } from './Text';
import Link from './Link';

/**
 *
 * TODO:Currently unused, remove later
 */
const QuickstartPanel = () => {
  return (
    <div className="mx-auto max-w-md rounded-lg bg-main p-6 shadow-lg">
      <Heading2 className="mb-4">Quickstart</Heading2>

      <ol className="space-y-4">
        <Body>
          Rivet helps product designers change real applications without coding.
        </Body>
        <li className="flex flex-col gap-2">
          <Body className="font-medium">
            1. Install{' '}
            <Link href="https://www.npmjs.com/package/rivet-design" external>
              Rivet
            </Link>
            :
          </Body>
          <Code copyable>npm install -g rivet-design</Code>
        </li>
        <li className="flex flex-col gap-2">
          <Body className="font-medium">2. Start your app:</Body>
          <Body>Start your app&apos;s development server</Body>
        </li>
        <li className="flex flex-col gap-2">
          <Body className="font-medium">3. Start Rivet:</Body>
          <Body>Open a second terminal window and type</Body>
          <Code copyable>rivet</Code>
        </li>
      </ol>
    </div>
  );
};

export default QuickstartPanel;
