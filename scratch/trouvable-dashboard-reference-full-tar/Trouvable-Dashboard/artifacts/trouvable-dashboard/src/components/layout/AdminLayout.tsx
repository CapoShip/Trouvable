import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopCommandBar } from './AdminTopCommandBar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="geo-shell dark">
      <AdminSidebar />
      <div className="geo-main">
        <AdminTopCommandBar />
        <div className="geo-content">{children}</div>
      </div>
    </div>
  );
}
