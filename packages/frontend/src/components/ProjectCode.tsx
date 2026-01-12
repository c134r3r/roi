import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ProjectCodeProps {
  code?: string;
}

export default function ProjectCode({ code }: ProjectCodeProps) {
  const [copied, setCopied] = useState(false);

  if (!code) {
    return null;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-xs font-mono">
      <span className="text-gray-600">Projekt-Code:</span>
      <span className="font-bold text-gray-900">{code}</span>
      <button
        onClick={copyToClipboard}
        title="In Zwischenablage kopieren"
        className="ml-1 p-1 hover:bg-gray-200 rounded transition-colors"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}
