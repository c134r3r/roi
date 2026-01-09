import { Download, Share2 } from 'lucide-react';

interface ResultsStepProps {
  onBack: () => void;
  onNewProject: () => void;
}

export default function ResultsStep({ onBack, onNewProject }: ResultsStepProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Analyseergebnisse</h2>
        <p className="text-gray-600">Überprüfen Sie die Ergebnisse und exportieren Sie diese</p>
      </div>

      <div className="card p-8 text-center text-gray-600">
        <p className="mb-6">Ergebnisse-Übersicht wird hier angezeigt</p>
        <div className="space-y-3">
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Als PDF exportieren
          </button>
          <button className="btn-secondary w-full flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            Zu Google Slides exportieren
          </button>
        </div>
      </div>

      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={onNewProject} className="btn-primary ml-auto">
          Neue Analyse
        </button>
      </div>
    </div>
  );
}
