import { useState } from 'react';
import { useAppStore } from '../store';
import { Plus, Trash2 } from 'lucide-react';

interface BenefitsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function BenefitsStep({ onNext, onBack }: BenefitsStepProps) {
  const [benefits, setBenefits] = useState([]);

  const handleAddBenefit = () => {
    // Placeholder für Benefit-Wizard
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Nutzeneffekte</h2>
        <p className="text-gray-600">
          Definieren Sie die wirtschaftlichen Effekte der Investition
        </p>
      </div>

      <div className="space-y-6">
        {benefits.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-gray-600 mb-6">Noch keine Nutzeneffekte hinzugefügt</p>
            <button onClick={handleAddBenefit} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-2" />
              Ersten Nutzeneffekt hinzufügen
            </button>
          </div>
        )}

        <button
          onClick={handleAddBenefit}
          className="card p-6 border-2 border-dashed border-gray-300 hover:border-brand-500 flex items-center justify-center gap-2 text-gray-600 hover:text-brand-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Weiterer Nutzeneffekt
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={onNext} className="btn-primary ml-auto">
          Weiter zu Szenarien
        </button>
      </div>
    </div>
  );
}
