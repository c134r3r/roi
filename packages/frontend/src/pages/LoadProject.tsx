import { useState } from 'react';
import { useAppStore, apiClient } from '../store';
import { ArrowLeft } from 'lucide-react';

interface LoadProjectProps {
  onProjectLoaded: (project: any) => void;
  onCreateNew: () => void;
}

export default function LoadProject({ onProjectLoaded, onCreateNew }: LoadProjectProps) {
  const [code, setCode] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.loadProject(code, showPassphrase ? passphrase : undefined);

      if (!response.success) {
        setError('Projekt nicht gefunden. Bitte überprüfen Sie den Code und die Passphrase.');
        setIsLoading(false);
        return;
      }

      setCurrentProject(response.data);
      onProjectLoaded(response.data);
    } catch (err) {
      setError('Fehler beim Laden des Projekts. Bitte versuchen Sie es später erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <button
        onClick={onCreateNew}
        className="btn-ghost mb-8 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Neue Analyse erstellen
      </button>

      <div className="card p-8">
        <h2 className="heading-2 mb-2">Projekt laden</h2>
        <p className="text-gray-600 mb-6">
          Geben Sie Ihren Projekt-Code ein, um die Analyse fortzusetzen.
        </p>

        <form onSubmit={handleLoad} className="space-y-4">
          <div>
            <label className="label">Projekt-Code</label>
            <input
              type="text"
              className="input uppercase"
              placeholder="z.B. SF2025-9XJ2K"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={12}
              required
            />
            <p className="text-muted mt-1">Der Code wurde Ihnen bei der Speicherung angezeigt</p>
          </div>

          {showPassphrase && (
            <div>
              <label className="label">Passphrase (optional)</label>
              <input
                type="password"
                className="input"
                placeholder="Ihre Passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            className="text-sm text-brand-600 hover:text-brand-700"
            onClick={() => setShowPassphrase(!showPassphrase)}
          >
            {showPassphrase ? 'Passphrase nicht nötig' : 'Ich habe eine Passphrase'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            Projekt laden
          </button>
        </form>
      </div>
    </div>
  );
}
