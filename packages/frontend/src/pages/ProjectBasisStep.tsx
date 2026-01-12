import { useState } from 'react';
import { useAppStore, apiClient } from '../store';
import { HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project, Investment } from '@roi/shared';

interface ProjectBasisStepProps {
  onNext: () => void;
  onBack: () => void;
}

// Tooltip Komponente
function Tooltip({ text }: { text: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

export default function ProjectBasisStep({ onNext, onBack }: ProjectBasisStepProps) {
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const saveProjectToDatabase = useAppStore((s) => s.saveProjectToDatabase);
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const setError = useAppStore((s) => s.setError);
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

  const [localError, setLocalError] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    try {
      // Validiere Form-Daten lokal
      if (!formData.projectName || formData.projectName.trim().length === 0) {
        throw new Error('Projektname ist erforderlich');
      }

      // Erstelle Projekt lokal
      const newProject: Project = {
        id: uuidv4(),
        code: '', // Wird später generiert beim Speichern in der Datenbank
        title: formData.projectName,
        description: formData.projectDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
        investments: [
          {
            id: uuidv4(),
            name: formData.projectName,
            status: 'DRAFT',
            costs: [],
            benefits: [],
            scenarios: [],
            computedKPIs: {
              roi: 0,
              roiAbsolute: 0,
              paybackPeriod: 0,
              discountedPayback: 0,
              npv: 0,
              irr: 0,
              profitabilityIndex: 0,
            },
            cashflows: [],
            sensitivity: { drivers: [] },
          } as Investment,
        ],
        settings: {
          currency: formData.currency as any,
          horizon: parseInt(formData.horizon),
          discountRate: formData.discountRate / 100,
          baseCurrency: formData.currency,
        },
      };

      console.log('Created local project:', newProject.title);

      // Speichere in Zustand
      setCurrentProject(newProject);

      // Versuche, das Projekt in der Datenbank zu speichern
      try {
        const savedProject = await saveProjectToDatabase(newProject);
        console.log('Project saved to database with code:', savedProject.code);
        setCurrentProject(savedProject);
      } catch (dbError) {
        console.warn('Database save failed, continuing with local project:', dbError);
        // Fallback: Aktualisiere Project mit zufälligem Code für lokale Nutzung
        newProject.code = 'LOCAL-' + uuidv4().slice(0, 8).toUpperCase();
        setCurrentProject(newProject);
      }

      setIsLoading(false);
      onNext();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error creating project:', errorMsg, error);
      setLocalError(errorMsg);
      setError(errorMsg);
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
        {localError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {localError}
          </div>
        )}

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
              <Tooltip text="Zeitraum für ROI-Berechnung und Amortisationsdauer" />
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="3"
                max="10"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                value={formData.horizon}
                onChange={(e) => handleChange('horizon', parseInt(e.target.value))}
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>3 Jahre</span>
                <span className="font-semibold text-brand-600">{formData.horizon} Jahre</span>
                <span>10 Jahre</span>
              </div>
            </div>
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
              <Tooltip text="Kapitalkosten des Unternehmens. Standard: 8% für IT-Investitionen in Deutschland" />
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
              <span className="text-gray-600 font-medium">%</span>
            </div>
            <p className="text-muted mt-1">
              💡 Nicht sicher? 8% ist ein guter Standard für IT-Investitionen.
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
