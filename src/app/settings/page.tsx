"use client";

import { useState } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { AIRouterConfig } from "@/components/settings/sections/AIRouterConfig";
import { HostingIntegrations } from "@/components/settings/sections/HostingIntegrations";
import { ServiceConfigs } from "@/components/settings/sections/ServiceConfigs";
import { GeneralInfrastructure } from "@/components/settings/sections/GeneralInfrastructure";

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('router');

    const renderContent = () => {
        switch (activeSection) {
            case 'router': return <AIRouterConfig />;
            case 'hosting': return <HostingIntegrations />;
            case 'services': return <ServiceConfigs />;
            case 'general': return <GeneralInfrastructure />;
            default: return <AIRouterConfig />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            
            <div className="flex-1 space-y-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Global Settings</h1>
                    <p className="text-muted-foreground">Configure your FlexIA environment, API keys, and service integrations.</p>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
