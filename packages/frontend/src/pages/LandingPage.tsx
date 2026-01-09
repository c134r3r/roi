import { BarChart3, Zap, Target, LineChart, Plus, FolderOpen } from 'lucide-react';

interface LandingPageProps {
  onNewProject: () => void;
  onLoadProject: () => void;
}

export default function LandingPage({ onNewProject, onLoadProject }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Logo/Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="heading-1 mb-4">ROI Calculator</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professionelle Investitionsanalyse für SaaS & IT-Projekte
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Zap,
              title: 'Qualität zu Quantität',
              description: 'Verwandeln Sie qualitative Effekte in nachvollziehbare monetäre Werte',
            },
            {
              icon: Target,
              title: 'Szenario-Vergleich',
              description: 'Vergleichen Sie pessimistische, realistische und optimistische Szenarien',
            },
            {
              icon: LineChart,
              title: 'Export in 2 Klicks',
              description: 'Generieren Sie sofort präsentationsfähige Charts & Slides',
            },
          ].map((feature) => (
            <div key={feature.title} className="card p-6">
              <feature.icon className="w-8 h-8 text-brand-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA - Two options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Neue Analyse */}
          <div className="card p-8 text-center hover:shadow-lg transition">
            <div className="flex items-center justify-center w-12 h-12 bg-brand-100 rounded-xl mx-auto mb-4">
              <Plus className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="heading-3 mb-2">Neue Analyse</h3>
            <p className="text-gray-600 mb-6">
              Starten Sie eine neue Investitionsanalyse von Grund auf
            </p>
            <button
              onClick={onNewProject}
              className="btn-primary w-full"
            >
              Neue Analyse erstellen
            </button>
          </div>

          {/* Altes Projekt laden */}
          <div className="card p-8 text-center hover:shadow-lg transition border-2 border-gray-300">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4">
              <FolderOpen className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="heading-3 mb-2">Projekt fortsetzen</h3>
            <p className="text-gray-600 mb-6">
              Laden Sie ein gespeichertes Projekt mit Ihrem Projekt-Code
            </p>
            <button
              onClick={onLoadProject}
              className="btn-secondary w-full"
            >
              Mit Code laden
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            💡 Kein Login erforderlich. Speichern Sie Ihre Projekte mit einem eindeutigen Projekt-Code.
          </p>
        </div>
      </div>
    </div>
  );
}
