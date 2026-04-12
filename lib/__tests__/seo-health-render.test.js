import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get(_, tag) {
        return React.forwardRef(({ children, variants, initial, animate, transition, layoutId, ...rest }, ref) =>
          React.createElement(tag, { ...rest, ref }, children)
        );
      }
    }),
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/clients/test-id/seo/health',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...rest }) => {
    const React = require('react');
    return React.createElement('a', rest, children);
  }
}));

// We need to mock the ClientContext
const mockContextValue = {
  client: { id: 'test-id', client_name: 'Test Client' },
  clientId: 'test-id',
  audit: null,
  workspace: null,
  clients: [],
  loading: false,
  error: null,
  isNewClientPage: false,
  refreshToken: 0,
  switchClient: vi.fn(),
  invalidateWorkspace: vi.fn(),
  refetch: vi.fn(),
  getInitials: () => 'TC',
};

vi.mock('@/app/admin/(gate)/context/ClientContext', () => ({
  useGeoClient: () => mockContextValue,
  useSeoWorkspaceSlice: (slice) => ({
    data: { available: false, emptyState: { title: 'Non disponible', description: 'Données non disponibles.' } },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  ClientProvider: ({ children }) => {
    const React = require('react');
    return React.createElement('div', null, children);
  },
}));

describe('SeoHealthView SSR render', () => {
  it('should render SeoHealthView without crash (empty state)', async () => {
    const { default: SeoHealthView } = await import('@/app/admin/(gate)/views/SeoHealthView');
    
    let html;
    try {
      html = renderToString(React.createElement(SeoHealthView));
    } catch (err) {
      console.error('RENDER ERROR:', err.message);
      console.error('Stack:', err.stack);
      throw err;
    }
    
    expect(html).toBeTruthy();
    expect(html).toContain('Santé technique SEO');
  });

  it('should render SeoHealthView with data', async () => {
    // Re-mock with data available
    const ctx = await import('@/app/admin/(gate)/context/ClientContext');
    vi.mocked(ctx.useSeoWorkspaceSlice).mockReturnValue({
      data: {
        available: true,
        seoScore: 72,
        seoScoreLabel: 'SEO technique',
        seoScoreProvenance: 'Test provenance',
        issueCount: 5,
        strengthCount: 3,
        totalIssueCount: 10,
        auditDate: '2026-01-01',
        issues: [
          { key: 'test-issue', label: 'Test Issue', severity: 'high', category: 'technical' },
        ],
        strengths: [
          { key: 'test-strength', label: 'Test Strength' },
        ],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    const { default: SeoHealthView } = await import('@/app/admin/(gate)/views/SeoHealthView');
    
    let html;
    try {
      html = renderToString(React.createElement(SeoHealthView));
    } catch (err) {
      console.error('RENDER ERROR:', err.message);
      console.error('Stack:', err.stack);
      throw err;
    }
    
    expect(html).toBeTruthy();
    expect(html).toContain('Santé technique SEO');
  });

  it('should render SeoLocalView without crash', async () => {
    const { default: SeoLocalView } = await import('@/app/admin/(gate)/views/SeoLocalView');
    const html = renderToString(React.createElement(SeoLocalView));
    expect(html).toBeTruthy();
  });

  it('should render SeoActionsView without crash', async () => {
    const { default: SeoActionsView } = await import('@/app/admin/(gate)/views/SeoActionsView');
    const html = renderToString(React.createElement(SeoActionsView));
    expect(html).toBeTruthy();
  });
});
