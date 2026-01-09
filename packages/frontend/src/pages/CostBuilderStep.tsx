import { useState } from 'react';
import { useAppStore } from '../store';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CostBuilderStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function CostBuilderStep({ onNext, onBack }: CostBuilderStepProps) {
  const currentProject = useAppStore((s) => s.currentProject);
  const [costs, setCosts] = useState([
    {
      id: uuidv4(),
      category: 'LICENSES',
      name: 'Lizenzen (First Year)',
      items: [{ id: uuidv4(), quantity: 50, unit: 'User', unitPrice: 15, frequency: 'MONTHLY' }],
    },
  ]);

  const handleAddCostBlock = () => {
    setCosts((prev) => [
      ...prev,
      {
        id: uuidv4(),
        category: 'OTHER',
        name: 'Neue Kosten-Komponente',
        items: [],
      },
    ]);
  };

  const handleRemoveCost = (id: string) => {
    setCosts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Kostenaufbau</h2>
        <p className="text-gray-600">Definieren Sie alle Kosten für die Investition</p>
      </div>

      <div className="space-y-6">
        {costs.map((costBlock) => (
          <div key={costBlock.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="heading-3 text-gray-900">{costBlock.name}</h3>
                <p className="text-muted">{costBlock.category}</p>
              </div>
              <button
                onClick={() => handleRemoveCost(costBlock.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Placeholder für Cost Items */}
            <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
              Kosten-Komponenten-Editor wird hier angezeigt
            </div>
          </div>
        ))}

        <button
          onClick={handleAddCostBlock}
          className="card p-6 border-2 border-dashed border-gray-300 hover:border-brand-500 flex items-center justify-center gap-2 text-gray-600 hover:text-brand-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neue Kosten-Komponente hinzufügen
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={onNext} className="btn-primary ml-auto">
          Weiter zu Nutzen
        </button>
      </div>
    </div>
  );
}
