import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FortisignLanding() {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(0);

    const featureCategories = [
        {
            title: 'Treasury Management',
            subtitle: 'Streamline operations with approval workflows and secure asset management',
            features: [
                'Multi-signature approval thresholds',
                'Time-based voting periods',
                'Real-time transaction monitoring',
                'Proposal closing facility'
            ]
        },
        {
            title: 'Programs and Tokens',
            subtitle: 'Manage program upgrades, token mints, and authority transfers with confidence',
            features: [
                'Program upgrade management',
                'Token mint, transfer and burn controls',
                'Authority key management',
                'Custom transaction builder'
            ]
        },
        {
            title: 'Developer Tools',
            subtitle: 'Build custom solutions with comprehensive SDK and CLI tools',
            features: [
                'Fortis SDK integration',
                'Command-line interface',
                'Litesvm simulation support',
                'On-chain verification'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Fortis" className="w-8 h-8" />
                        <span className="text-xl font-semibold">Fortis</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="https://docs.fortisign.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Docs
                        </a>
                        <a
                            href="https://github.com/Fortis-labs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Github
                        </a>
                        <a
                            href="https://discord.gg/exNzJHqGU8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Discord
                        </a>
                        <button
                            onClick={() => navigate('/create')}
                            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="flex justify-center mb-8">
                        <img
                            src="/logo.png"
                            alt="Fortis Logo"
                            className="w-24 h-24"
                            style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' }}
                        />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                        Fortis Multisig
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
                        A security-first multisig for Solana's high-stake workflows
                    </p>
                    <button
                        onClick={() => navigate('/create')}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Get started
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 px-6 border-t">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">About Fortis</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    Fortis is a <strong className="text-foreground">security-first multisig</strong>, built for Solana's high-stake workflows. With Fortis, teams can deploy a multisig with a single click, create proposals for initiatives, vote securely, and execute decisions collectively.
                                </p>
                                <p>
                                    Our goal in building Fortis is to deliver a secure solution that actively mitigates common attack vectors such as blind signing and address poisoning.
                                </p>
                                <p>
                                    Fortis leverages Solana’s decentralized infrastructure. All multisig rules, workflows, and security guarantees are enforced transparently by Fortis Labs and Solana’s network of over 1,000 global validators.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                                <img
                                    src="/logo.png"
                                    alt="Fortis"
                                    className="relative w-64 h-64"
                                    style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Categories */}
            <section id="features" className="py-20 px-6 border-t">
                <div className="max-w-6xl mx-auto">
                    {/* Category Tabs */}
                    <div className="flex gap-4 mb-16 border-b overflow-x-auto">
                        {featureCategories.map((category, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveFeature(idx)}
                                className={`pb-4 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeFeature === idx
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {category.title}
                            </button>
                        ))}
                    </div>

                    {/* Active Category Content */}
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {featureCategories[activeFeature].title}
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                {featureCategories[activeFeature].subtitle}
                            </p>
                            <ul className="space-y-4">
                                {featureCategories[activeFeature].features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 rounded-full bg-primary/10 p-1">
                                            <Check className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-8 border">
                            <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                                <img
                                    src="/logo.png"
                                    alt="Fortis Feature"
                                    className="w-32 h-32 opacity-20 relative"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="py-20 px-6 border-t">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Built on Solana
                    </h2>
                    <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                        Fortis operates on Solana's autonomous finance layer. Each multisig's rules and security are enforced by Solana's 1,000+ global validators.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-4xl font-bold mb-2">100%</div>
                            <div className="text-sm text-muted-foreground">On-Chain</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">0</div>
                            <div className="text-sm text-muted-foreground">Breaches</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">24/7</div>
                            <div className="text-sm text-muted-foreground">Monitoring</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">∞</div>
                            <div className="text-sm text-muted-foreground">Scalability</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 border-t">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">
                        Create your multisig in a few clicks
                    </h2>
                    <button
                        onClick={() => navigate('/create')}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Create my multisig
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/logo.png" alt="Fortis" className="w-6 h-6" />
                                <span className="font-semibold">Fortis</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                A secure multisig for Solana high-stake workflows
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3 text-sm">Resources</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="https://docs.fortisign.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Docs
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/Fortis-labs"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Github
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3 text-sm">Community</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a
                                        href="https://discord.gg/exNzJHqGU8"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Discord
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t text-center text-sm text-muted-foreground">
                        <p>All rights reserved.</p>
                        <p className="mt-1">Fortis Labs is a Research and Development firm.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}