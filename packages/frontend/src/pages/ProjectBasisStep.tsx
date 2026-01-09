import { useState } from 'react';
import { useAppStore, apiClient } from '../store';
import { HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@roi/shared';

interface ProjectBasisStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ProjectBasisStep({ onNext, onBack }: ProjectBasisStepProps) {
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const currentProject = useAppStore((s) => s.currentProject);

  const [formData, setFormData] = useState(
    currentProject || {
      projectName: '',
      projectDescription: '',
      horizon: 3,
      currency: 'EUR',
      discountRate: 8,
      startDate: new Date().toISOString().split('T')[0],
    }
  );

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.createProject({
        title: formData.projectName,
        description: formData.projectDescription,
        settings: {
          currency: formData.currency,
          horizon: parseInt(formData.horizon),
          discountRate: formData.discountRate / 100,
          baseCurrency: formData.currency,
        },
      });

      if (response.success) {
        setCurrentProject(response.data);
        setIsLoading(false);
        onNext();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Projektbasis</h2>
        <p className="text-gray-600">
          Definieren Sie die grundlegenden Parameter für Ihre Investitionsanalyse
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projektname */}
          <div className="md:col-span-2">
            <label className="label">Projektname</label>
            <input
              type="text"
              className="input"
              placeholder="z.B. Salesforce CRM Implementation"
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              required
            />
          </div>

          {/* Beschreibung */}
          <div className="md:col-span-2">
            <label className="label">Beschreibung (kurz)</label>
            <textarea
              className="input min-h-20"
              placeholder="z.B. Migration von Spreadsheets zu professionellem CRM-System"
              value={formData.projectDescription}
              onChange={(e) => handleChange('projectDescription', e.target.value)}
              maxLength={500}
            />
            <p className="text-muted mt-1">
              {formData.projectDescription.length}/500 Zeichen
            </p>
          </div>

          {/* Startdatum */}
          <div>
            <label className="label">Startdatum</label>
            <input
              type="date"
              className="input"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>

          {/* Betrachtungszeitraum */}
          <div>
            <label className="label flex items-center gap-2">
              Betrachtungszeitraum
              <HelpCircle className="w-4 h-4 text-gray-400" title="Zeitraum für ROI-Berechnung" />
            </label>
            <select
              className="input"
              value={formData.horizon}
              onChange={(e) => handleChange('horizon', parseInt(e.target.value))}
            >
              <option value={3}>3 Jahre</option>
              <option value={5}>5 Jahre</option>
              <option value={7}>7 Jahre</option>
            </select>
          </div>

          {/* Währung */}
          <div>
            <label className="label">Währung</label>
            <select
              className="input"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF (CHF)</option>
            </select>
          </div>

          {/* Diskontsatz (WACC) */}
          <div>
            <label className="label flex items-center gap-2">
              Diskontsatz (WACC)
              <HelpCircle
                className="w-4 h-4 text-gray-400"
                title="Kapitalkosten des Unternehmens. Standard: 8% für IT-Investitionen"
              />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input flex-1"
                min="0"
                max="50"
                step="0.1"
                value={formData.discountRate}
                onChange={(e) => handleChange('discountRate', parseFloat(e.target.value))}
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-muted mt-1">
              Nicht sicher? 8% ist ein guter Standard für IT-Investitionen.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 pt-6 border-t">
          <button type="button" onClick={onBack} className="btn-secondary">
            Zurück
          </button>
          <button type="submit" className="btn-primary ml-auto">
            Weiter zu Kosten
          </button>
        </div>
      </form>
    </div>
  );
}
