import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { generateInstallRef, parseInstallRef } from '@/lib/installRef';
import PromptInstallButton from './PromptInstallButton';
import InstallAccordion from './InstallAccordion';

const InstallPage = () => {
  const [installRef] = useState(
    () =>
      parseInstallRef(new URLSearchParams(window.location.search).get('ref')) ??
      generateInstallRef(),
  );
  const [isPhone, setIsPhone] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsPhone(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 py-16 text-[#642e39]">
      <Toaster />
      <div className="w-full max-w-xl space-y-8">
        <a href="/" className="font-main text-xl text-primary">
          Rivet
        </a>
        <h1 className="font-main text-4xl tracking-tight">Install Rivet</h1>
        {isPhone ? (
          <p className="font-main text-lg">
            Open this on your computer to install Rivet in Claude, Codex, or
            Cursor.
          </p>
        ) : (
          <>
            <p className="font-main text-lg">
              Choose your coding agent, then paste the copied prompt into a chat
              to install Rivet.
            </p>
            <PromptInstallButton
              source="email_install_page"
              installRef={installRef}
              label="Install Rivet"
              size="lg"
            />
            <InstallAccordion
              source="email_install_page"
              installRef={installRef}
              defaultOpen
            />
          </>
        )}
      </div>
    </main>
  );
};

export default InstallPage;
