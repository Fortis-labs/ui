import { ArrowDownUp, LucideHome, Settings, Users, Box, Github, Plus, BookOpen } from 'lucide-react';
import ConnectWallet from '../components/ConnectWalletButton';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ChangeMultisigFromNav } from './ChangeMultisigFromNav';


export default function TabNav() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: 'Create Fortis', icon: <Plus className="h-5 w-5" />, route: '/create' },
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
        <div
          className="flex w-full flex-col justify-between px-4 py-6 text-[hsl(var(--foreground))] transition-colors"
          style={{
            backgroundColor: 'hsl(var(--background))',
            borderRight: '1px solid hsl(var(--border))',
          }}
        >
          {/* Top */}
          <div>
            <Link to="/" className="mb-10 flex items-center px-2">
              <img
                src="/logo.png"
                width={32}
                alt=""
                className="mr-2"
              />
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(200,95%,58%)] to-[hsl(210,90%,52%)]">
                Fortis
              </span>
            </Link>

            <ul className="space-y-1">
              {tabs.map((tab) => {
                const active =
                  path === tab.route || path.startsWith(`${tab.route}/`);

                return (
                  <li key={tab.route}>
                    <Link
                      to={tab.route}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all
                        ${active
                          ? 'text-white'
                          : 'hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                        }`}
                      style={
                        active
                          ? {
                            background: 'linear-gradient(135deg, hsl(200, 95%, 58%) 0%, hsl(210, 90%, 52%) 100%)',
                            boxShadow: '0 0 16px hsla(200, 95%, 58%, 0.35)',
                          }
                          : {}
                      }
                    >
                      {tab.icon}
                      <span>{tab.name}</span>
                    </Link>
                  </li>
                );
              })}

              <li className="pt-4">
                <a
                  href="https://docs.fortisign.org" // ✅ Replaced with Docs
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm hover:bg-[hsl(var(--accent))] transition-colors"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  <BookOpen className="h-5 w-5" /> {/* Optional: change icon */}
                  Docs
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
      <aside
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        style={{
          backgroundColor: 'hsl(var(--background))',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 py-2">
          {tabs.map((tab) => {
            const active =
              path === tab.route || path.startsWith(`${tab.route}/`);

            return (
              <Link key={tab.route} to={tab.route}>
                <div
                  className={`flex flex-col items-center gap-1 py-2 text-xs transition-all font-medium rounded-lg mx-1`}
                  style={
                    active
                      ? {
                        background: 'linear-gradient(135deg, hsl(200, 95%, 58%) 0%, hsl(210, 90%, 52%) 100%)',
                        color: '#ffffff',
                        boxShadow: '0 0 12px hsla(200, 95%, 58%, 0.3)',
                      }
                      : {
                        color: 'hsl(var(--muted-foreground))',
                      }
                  }
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
