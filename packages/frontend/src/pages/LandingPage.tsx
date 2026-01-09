import { BarChart3, Zap, Target, LineChart } from 'lucide-react';

interface LandingPageProps {
  onNext: () => void;
}

export default function LandingPage({ onNext }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center w-16 h-16 bg-brand-100 rounded-2xl mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="heading-1 mb-4">ROI Calculator</h1>
          <p className="text-lg text-gray-600">
            Professionelle Investitionsanalyse für SaaS & IT-Projekte
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

        {/* CTA */}
        <div className="space-y-4">
          <button
            onClick={onNext}
            className="btn-primary w-full py-3 text-lg"
          >
            Neue Analyse erstellen
          </button>
          <p className="text-sm text-gray-500">
            Kein Login erforderlich. Speichern Sie Ihre Projekte mit Projekt-Code.
          </p>
        </div>
      </div>
    </div>
  );
}
