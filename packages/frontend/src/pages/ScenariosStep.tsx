interface ScenariosStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ScenariosStep({ onNext, onBack }: ScenariosStepProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Szenarien & Sensitivität</h2>
        <p className="text-gray-600">Analysieren Sie verschiedene Szenarien</p>
      </div>

      <div className="card p-8 text-center text-gray-600">
        <p>Szenarien-Editor wird hier angezeigt</p>
      </div>

      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={onNext} className="btn-primary ml-auto">
          Zu Ergebnissen
        </button>
      </div>
    </div>
  );
}
