'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/agent-zero/api';
import { Loader2, Save, Search, AlertCircle, Terminal, Lightbulb, SettingsIcon, RefreshCw, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { Field, Section } from './types';
import {
  SelectField,
  TextField,
  PasswordField,
  NumberField,
  RangeField,
  SwitchField,
  TextareaField,
  ButtonField,
  HtmlField
} from './fields';

export function SettingsView({ initialSettings, instanceId }: { initialSettings?: any; instanceId?: string }) {
  const [settings, setSettings] = useState<any>(initialSettings || null);
  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);
  const [jsonText, setJsonText] = useState(initialSettings ? JSON.stringify(initialSettings, null, 2) : '');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredFieldDescription, setHoveredFieldDescription] = useState<string | null>(null);

  const { can, loading: permissionLoading } = usePermission();
  const canEdit = can('manage_system_settings');

  useEffect(() => {
    if (!initialSettings) {
      loadSettings();
    } else {
      const tabs = computeTabs(initialSettings?.sections || []);
      setActiveTab(tabs[0] || null);
    }
  }, [initialSettings, instanceId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings(instanceId);
      if (data.settings) {
        setSettings(data.settings);
        setJsonText(JSON.stringify(data.settings, null, 2));
        const tabs = computeTabs(data.settings?.sections || []);
        setActiveTab(tabs[0] || null);
      }
    } catch (e) {
      setError("Failed to load settings");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      const parsed = showJson ? JSON.parse(jsonText) : settings;
      await saveSettings(parsed, instanceId);
      setSettings(parsed);
      loadSettings();
    } catch (e) {
      setError("Failed to save settings: Invalid JSON or API error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const computeTabs = (sections: Section[]) => {
    const arr = sections.map(s => s.tab || 'general');
    return Array.from(new Set(arr));
  };

  const tabs = useMemo(() => computeTabs(settings?.sections || []), [settings]);

  const currentSections: Section[] = useMemo(() => {
    if (!settings?.sections) return [];
    if (!activeTab) return settings.sections;
    return settings.sections.filter((s: Section) => (s.tab || 'general') === activeTab);
  }, [settings, activeTab]);

  const updateFieldValue = (sectionId: string, fieldId: string, value: any) => {
    if (!settings || !canEdit) return;
    const next = {
      ...settings,
      sections: (settings.sections || []).map((sec: Section) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          fields: sec.fields.map((f: Field) => (f.id === fieldId ? { ...f, value } : f)),
        };
      }),
    };
    setSettings(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  const FieldRenderer = ({ 
    section, 
    field,
    onHover,
    disabled
  }: { 
    section: Section; 
    field: Field;
    onHover: (desc: string | null) => void;
    disabled: boolean;
  }) => {
    if (field.hidden) return null;

    // We pass 'any' to disabled prop for now until we update field components types
    const props = {
        section,
        field,
        onHover,
        updateFieldValue,
        disabled
    } as any;

    switch (field.type) {
      case 'select':
        return <SelectField {...props} />;
      case 'text':
        return <TextField {...props} />;
      case 'password':
        return <PasswordField {...props} />;
      case 'number':
        return <NumberField {...props} />;
      case 'range':
        return <RangeField {...props} />;
      case 'switch':
        return <SwitchField {...props} />;
      case 'textarea':
        return <TextareaField {...props} />;
      case 'button':
        return <ButtonField {...props} />;
      case 'html':
        return <HtmlField field={field} />;
      default:
        return null;
    }
  };

  if (loading || permissionLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Sidebar - Navigation */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6 lg:border-r border-white/5 lg:pr-6">
        <div className="space-y-4 lg:sticky lg:top-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2 hidden lg:block">Settings</h3>
          <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'general' && <SettingsIcon className="w-4 h-4" />}
                {tab === 'agent' && <Lightbulb className="w-4 h-4" />}
                {tab === 'developer' && <Terminal className="w-4 h-4" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Configuration</h1>
              <p className="text-muted-foreground">Manage your Agent Zero settings and preferences.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background/50 pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search settings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              <button 
                onClick={handleSave}
                disabled={saving || !canEdit}
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-lg",
                    canEdit 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20" 
                        : "bg-muted text-muted-foreground"
                )}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : canEdit ? <Save className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                {canEdit ? 'Save' : 'Read Only'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
              {currentSections.map(section => {
                const filteredFields = section.fields.filter(f => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    section.title?.toLowerCase().includes(q) ||
                    f.title?.toLowerCase().includes(q) ||
                    f.description?.toLowerCase().includes(q) ||
                    f.id?.toLowerCase().includes(q)
                  );
                });

                if (filteredFields.length === 0) return null;

                return (
                  <div key={section.id} className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">{section.title}</h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      )}
                    </div>
                    <div className="grid gap-6">
                      {filteredFields.map(field => (
                        <FieldRenderer 
                          key={field.id} 
                          section={section} 
                          field={field} 
                          onHover={setHoveredFieldDescription}
                          disabled={!canEdit}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Side - Insight Panel (Visible on XL screens) */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-4 space-y-6">
             <div className="rounded-xl border bg-blue-950/20 border-blue-900/30 overflow-hidden shadow-lg">
                <div className="p-4 bg-blue-900/20 border-b border-blue-900/30 flex items-center gap-2 text-blue-400">
                  <Lightbulb className="h-4 w-4" />
                  <h4 className="font-semibold text-sm">Deep Insight</h4>
                </div>
                <div className="p-5 text-sm text-muted-foreground leading-relaxed min-h-[8rem]">
                  {hoveredFieldDescription ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in duration-200">
                       <span dangerouslySetInnerHTML={{ __html: hoveredFieldDescription }} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center opacity-50 gap-2">
                       <Search className="h-8 w-8 mb-2 opacity-50" />
                       <span className="italic">Hover over any setting to reveal detailed documentation.</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-xl border bg-card/30 p-4 space-y-2">
                 <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
                 <button 
                    onClick={() => loadSettings()}
                    disabled={!canEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset to Defaults
                 </button>
                 <button 
                    onClick={() => setShowJson(!showJson)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors text-left"
                  >
                    <Terminal className="h-4 w-4" />
                    {showJson ? "View Form" : "View JSON"}
                 </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
