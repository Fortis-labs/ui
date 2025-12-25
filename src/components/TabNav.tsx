import { ArrowDownUp, LucideHome, Settings, Users, Box, Github } from 'lucide-react';
import ConnectWallet from '../components/ConnectWalletButton';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ChangeMultisigFromNav } from './ChangeMultisigFromNav';
export default function TabNav() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: 'Home', icon: <LucideHome className="h-5 w-5" />, route: '/' },
    { name: 'Transactions', icon: <ArrowDownUp className="h-5 w-5" />, route: '/transactions' },
    { name: 'Programs', icon: <Box className="h-5 w-5" />, route: '/programs' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-72"
        aria-label="Sidebar"
      >
        <div className="flex w-full flex-col justify-between border-r border-slate-800 bg-slate-950 px-4 py-6 text-slate-200">
          {/* Top */}
          <div>
            <Link to="/" className="mb-10 flex items-center px-2">
              <img src="/logo.png" width={140} alt="Fortis" />
            </Link>

            <ul className="space-y-1">
              {tabs.map((tab) => {
                const active =
                  path === tab.route || path.startsWith(`${tab.route}/`);

                return (
                  <li key={tab.route}>
                    <Link
                      to={tab.route}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all
                        ${active
                          ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                    >
                      {tab.icon}
                      <span>{tab.name}</span>
                    </Link>
                  </li>
                );
              })}

              <li className="pt-4">
                <a
                  href="https://github.com/Fortis-labs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm
                    text-slate-400 hover:bg-slate-900 hover:text-white"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Bottom */}
          <div className="space-y-3">
            <ChangeMultisigFromNav />
            <ConnectWallet />
          </div>
        </div>
      </aside>

      {/* MOBILE NAVBAR */}
      <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-950 md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 py-2">
          {tabs.map((tab) => {
            const active =
              path === tab.route || path.startsWith(`${tab.route}/`);

            return (
              <Link key={tab.route} to={tab.route}>
                <div
                  className={`flex flex-col items-center gap-1 py-2 text-xs transition
                    ${active
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {tab.icon}
                  {tab.name}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
