import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CostItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  frequency: 'ONE_TIME' | 'MONTHLY' | 'YEARLY';
}

interface CostBlock {
  id: string;
  category: string;
  name: string;
  items: CostItem[];
  annualGrowth?: number;
}

interface CostBuilderStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function CostBuilderStep({ onNext, onBack }: CostBuilderStepProps) {
  const currentProject = useAppStore((s) => s.currentProject);
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);

  const [costs, setCosts] = useState<CostBlock[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockName, setEditingBlockName] = useState<string>('');

  // Lade Kosten aus currentProject wenn Komponente geladen wird
  useEffect(() => {
    if (currentProject?.investments[0]?.costs && currentProject.investments[0].costs.length > 0) {
      // Wenn bereits Kosten vorhanden sind, lade diese
      setCosts(currentProject.investments[0].costs as CostBlock[]);
      const allIds = new Set(currentProject.investments[0].costs.map(c => c.id));
      setExpandedBlocks(allIds);
    }
  }, [currentProject?.investments[0]?.costs]);

  const handleNext = () => {
    if (currentProject && currentProject.investments[0]) {
      const updatedProject = { ...currentProject };
      updatedProject.investments[0].costs = costs;
      setCurrentProject(updatedProject);
    }
    onNext();
  };

  const toggleExpanded = (id: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditingName = (blockId: string, currentName: string) => {
    setEditingBlockId(blockId);
    setEditingBlockName(currentName);
  };

  const saveName = (blockId: string) => {
    if (editingBlockName.trim()) {
      setCosts((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, name: editingBlockName.trim() } : block
        )
      );
    }
    setEditingBlockId(null);
    setEditingBlockName('');
  };

  const cancelEditingName = () => {
    setEditingBlockId(null);
    setEditingBlockName('');
  };

  const calculateItemCost = (item: CostItem, horizon: number) => {
    const baseAmount = item.quantity * item.unitPrice;
    if (item.frequency === 'ONE_TIME') return baseAmount;
    if (item.frequency === 'MONTHLY') return baseAmount * 12;
    return baseAmount;
  };

  const calculateBlockTotal = (block: CostBlock, horizon: number) => {
    return block.items.reduce((sum, item) => sum + calculateItemCost(item, horizon), 0);
  };

  const totalCosts = costs.reduce((sum, block) => sum + calculateBlockTotal(block, currentProject?.settings.horizon || 3), 0);

  const handleAddItem = (blockId: string) => {
    setCosts((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              items: [
                ...block.items,
                {
                  id: uuidv4(),
                  description: '',
                  quantity: 1,
                  unit: '',
                  unitPrice: 0,
                  frequency: 'MONTHLY',
                },
              ],
            }
          : block
      )
    );
  };

  const handleUpdateItem = (blockId: string, itemId: string, field: string, value: any) => {
    setCosts((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              items: block.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : block
      )
    );
  };

  const handleRemoveItem = (blockId: string, itemId: string) => {
    setCosts((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, items: block.items.filter((i) => i.id !== itemId) }
          : block
      )
    );
  };

  const handleAddCostBlock = () => {
    const newBlockId = uuidv4();
    setCosts((prev) => [
      ...prev,
      {
        id: newBlockId,
        category: 'OTHER',
        name: 'Neue Kosten-Komponente',
        items: [],
        annualGrowth: 0,
      },
    ]);
    setExpandedBlocks((prev) => new Set([...prev, newBlockId]));
  };

  const handleRemoveBlock = (id: string) => {
    setCosts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="heading-2 mb-2">Kostenaufbau</h2>
        <p className="text-gray-600">Definieren Sie alle Kosten für die Investition</p>
      </div>

      <div className="space-y-4 mb-6">
        {costs.map((costBlock) => (
          <div key={costBlock.id} className="card overflow-hidden">
            <button
              onClick={() => toggleExpanded(costBlock.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="text-left flex-1">
                {editingBlockId === costBlock.id ? (
                  <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="input p-2"
                      value={editingBlockName}
                      onChange={(e) => setEditingBlockName(e.target.value)}
                      placeholder="Kosten-Komponente benennen"
                      autoFocus
                    />
                    <button
                      onClick={() => saveName(costBlock.id)}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditingName}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1 group">
                    <h3 className="font-semibold text-gray-900">{costBlock.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingName(costBlock.id, costBlock.name);
                      }}
                      className="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500">{costBlock.items.length} Position(en)</p>
              </div>
              <div className="text-right mr-4">
                <p className="font-semibold text-gray-900">
                  €{calculateBlockTotal(costBlock, currentProject?.settings.horizon || 3).toLocaleString('de-DE')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBlock(costBlock.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedBlocks.has(costBlock.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedBlocks.has(costBlock.id) && (
              <div className="px-4 pb-4 border-t border-gray-200 space-y-4 bg-gray-50">
                {costBlock.items.map((item) => (
                  <div key={item.id} className="bg-white rounded p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Beschreibung</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="z.B. Premium User Lizenzen"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(costBlock.id, item.id, 'description', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="label">Häufigkeit</label>
                        <select
                          className="input"
                          value={item.frequency}
                          onChange={(e) =>
                            handleUpdateItem(costBlock.id, item.id, 'frequency', e.target.value)
                          }
                        >
                          <option value="ONE_TIME">Einmalig</option>
                          <option value="MONTHLY">Monatlich</option>
                          <option value="YEARLY">Jährlich</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="label">Menge</label>
                        <input
                          type="number"
                          className="input"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(costBlock.id, item.id, 'quantity', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label className="label">Einheit</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="z.B. User"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(costBlock.id, item.id, 'unit', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">€ pro Einheit</label>
                        <input
                          type="number"
                          className="input"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(costBlock.id, item.id, 'unitPrice', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => handleRemoveItem(costBlock.id, item.id)}
                          className="btn-ghost w-full text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right text-sm font-medium text-gray-700">
                      Summe: €{calculateItemCost(item, currentProject?.settings.horizon || 3).toLocaleString('de-DE')}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddItem(costBlock.id)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Position hinzufügen
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Block Button */}
      <button
        onClick={handleAddCostBlock}
        className="card p-4 border-2 border-dashed border-gray-300 hover:border-brand-500 flex items-center justify-center gap-2 text-gray-600 hover:text-brand-600 transition-colors w-full"
      >
        <Plus className="w-5 h-5" />
        Neue Kosten-Komponente hinzufügen
      </button>

      {/* Summary Card */}
      <div className="mt-6 card p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Gesamtkosten (geschätzt)</p>
            <p className="heading-3 text-brand-600">
              €{totalCosts.toLocaleString('de-DE')}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Für {currentProject?.settings.horizon || 3} Jahre</p>
            <p>Durchschnitt: €{(totalCosts / (currentProject?.settings.horizon || 3)).toLocaleString('de-DE')}/Jahr</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-8 pt-6 border-t">
        <button onClick={onBack} className="btn-secondary">
          Zurück
        </button>
        <button onClick={handleNext} className="btn-primary ml-auto">
          Weiter zu Nutzen
        </button>
      </div>
    </div>
  );
}
