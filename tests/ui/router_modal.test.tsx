import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import RouterConfigModal from '@/components/services/router/RouterConfigModal';

describe('RouterConfigModal tabs', () => {
  it('renders key tabs and switches content', () => {
    const { getByText } = render(
      <RouterConfigModal
        service={{ id: 'svc_1', name: 'AI Router' } as any}
        instanceId="inst_1"
        onClose={() => {}}
      />
    );
    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Metrics')).toBeTruthy();
    expect(getByText('Logs')).toBeTruthy();
    expect(getByText('Console')).toBeTruthy();
    expect(getByText('Providers')).toBeTruthy();
    expect(getByText('Models')).toBeTruthy();
    expect(getByText('Access Keys')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();

    fireEvent.click(getByText('Metrics'));
    expect(getByText('Recent Telemetry')).toBeTruthy();
  });
});
