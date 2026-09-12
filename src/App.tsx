import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ProductScanner } from './components/ProductScanner';
import { InspectionDetail } from './components/InspectionDetail';
import { DashboardView } from './components/DashboardView';
import { RepositoryView } from './components/RepositoryView';
import { TechnicalDocsView } from './components/TechnicalDocsView';
import { OfficialReportPrintModal } from './components/OfficialReportPrintModal';
import { AuthView } from './components/AuthView';
import { InspectionRecord } from './types/metrology';
import { AuthUser, UserRole } from './types/auth';
import { safeStorage } from './utils/storage';

export default function App() {
  // Authentication gatekeeper: Only authenticated users can access the system
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const explicitlyLoggedOut = safeStorage.getItem('legal_metrology_explicit_logout');
    if (explicitlyLoggedOut === 'true') {
      return null;
    }
    const saved = safeStorage.getItem('legal_metrology_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    // Must return null so login/register gatekeeper is strictly required before accessing the site
    return null;
  });

  const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard' | 'repository' | 'rules_architecture'>('scanner');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState<any>('login');
  
  // Role is strictly locked to the authenticated user's account (no cross-role switching or data sharing)
  const userRole: UserRole = currentUser?.role || 'user';

  // Separate Inspector Data
  const [inspectorInspections, setInspectorInspections] = useState<InspectionRecord[]>(() => {
    const saved = safeStorage.getItem('legal_metrology_inspections_inspector');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse inspector inspections:', e);
      }
    }
    return [];
  });

  // Separate User Data
  const [userInspections, setUserInspections] = useState<InspectionRecord[]>(() => {
    const saved = safeStorage.getItem('legal_metrology_inspections_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse user inspections:', e);
      }
    }
    return [];
  });

  const [activeInspection, setActiveInspection] = useState<InspectionRecord | null>(null);
  const [printModalInspection, setPrintModalInspection] = useState<InspectionRecord | null>(null);

  // Sync auth user to safe storage
  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem('legal_metrology_auth_user', JSON.stringify(currentUser));
      safeStorage.removeItem('legal_metrology_explicit_logout');
    } else {
      safeStorage.removeItem('legal_metrology_auth_user');
    }
  }, [currentUser]);

  // Sync inspector inspections to isolated storage
  useEffect(() => {
    try {
      safeStorage.setItem('legal_metrology_inspections_inspector', JSON.stringify(inspectorInspections));
    } catch (e) {
      console.warn('safeStorage sync warning:', e);
    }
  }, [inspectorInspections]);

  // Sync user inspections to isolated storage
  useEffect(() => {
    try {
      safeStorage.setItem('legal_metrology_inspections_user', JSON.stringify(userInspections));
    } catch (e) {
      console.warn('safeStorage sync warning:', e);
    }
  }, [userInspections]);

  // Fetch only the relevant isolated dataset from backend for the logged-in role
  useEffect(() => {
    if (!currentUser) return;

    const currentRole = currentUser.role;
    fetch(`/api/inspections?role=${currentRole}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.inspections)) {
          if (currentRole === 'inspector') {
            setInspectorInspections(data.inspections);
          } else {
            setUserInspections(data.inspections);
          }
        }
      })
      .catch(err => {
        console.log(`${currentRole} DB sync offline:`, err);
      });
  }, [currentUser]);

  // Active dataset for current role (Strict data separation: User cannot see inspector records, inspector cannot see user records)
  const roleInspections = userRole === 'inspector' ? inspectorInspections : userInspections;

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveInspection(null);
    setActiveTab('scanner');
    setIsAuthenticating(false);
  };

  const handleLogout = () => {
    safeStorage.setItem('legal_metrology_explicit_logout', 'true');
    safeStorage.removeItem('legal_metrology_auth_user');
    setCurrentUser(null);
    setActiveInspection(null);
    setPrintModalInspection(null);
  };

  const handleInspectionComplete = (record: InspectionRecord) => {
    const recordWithRole: InspectionRecord = {
      ...record,
      created_by_role: userRole,
      created_by_user_id: currentUser?.id,
      created_by_user_name: currentUser?.name,
    };

    if (userRole === 'inspector') {
      setInspectorInspections(prev => [recordWithRole, ...prev.filter(i => i.id !== recordWithRole.id)]);
    } else {
      setUserInspections(prev => [recordWithRole, ...prev.filter(i => i.id !== recordWithRole.id)]);
    }

    setActiveInspection(recordWithRole);

    // Persist to isolated backend database
    fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordWithRole)
    }).catch(err => console.log('API sync error:', err));
  };

  const handleSaveToRepository = (record: InspectionRecord) => {
    const targetRole = userRole;
    const recordWithRole: InspectionRecord = {
      ...record,
      created_by_role: targetRole,
      created_by_user_id: record.created_by_user_id || currentUser?.id,
      created_by_user_name: record.created_by_user_name || currentUser?.name,
    };

    if (targetRole === 'inspector') {
      setInspectorInspections(prev => {
        const exists = prev.some(i => i.id === recordWithRole.id);
        if (exists) {
          return prev.map(i => i.id === recordWithRole.id ? recordWithRole : i);
        }
        return [recordWithRole, ...prev];
      });
    } else {
      setUserInspections(prev => {
        const exists = prev.some(i => i.id === recordWithRole.id);
        if (exists) {
          return prev.map(i => i.id === recordWithRole.id ? recordWithRole : i);
        }
        return [recordWithRole, ...prev];
      });
    }

    fetch(`/api/inspections/${recordWithRole.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordWithRole)
    }).catch(() => {
      fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordWithRole)
      }).catch(err => console.log('API save error:', err));
    });
  };

  const handleDeleteInspection = (id: string) => {
    if (userRole === 'inspector') {
      setInspectorInspections(prev => prev.filter(i => i.id !== id));
    } else {
      setUserInspections(prev => prev.filter(i => i.id !== id));
    }

    if (activeInspection?.id === id) {
      setActiveInspection(null);
    }
    fetch(`/api/inspections/${id}`, { method: 'DELETE' }).catch(err => console.log(err));
  };

  const handleSelectInspection = (record: InspectionRecord) => {
    setActiveInspection(record);
    setActiveTab('scanner');
  };

  const handleNewScan = () => {
    setActiveInspection(null);
    setActiveTab('scanner');
  };

  if (!currentUser && isAuthenticating) {
    return (
      <AuthView 
        onLoginSuccess={handleLoginSuccess} 
        onCancel={() => setIsAuthenticating(false)} 
        initialMode={authMode} 
      />
    );
  }

    if (!currentUser) {
    return (
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inspectionsCount={0}
        isPublic={true}
        onAuthClick={(mode) => {
          setAuthMode(mode);
          setIsAuthenticating(true);
        }}
      >
        <TechnicalDocsView />
      </Layout>
    );
  }

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        inspectionsCount={roleInspections.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        isPublic={false}
      >
        {activeTab === 'scanner' && (
          <>
            {activeInspection ? (
              <InspectionDetail
                inspection={activeInspection}
                onBack={() => setActiveInspection(null)}
                onSaveToRepository={handleSaveToRepository}
                onOpenPrintModal={(record) => setPrintModalInspection(record)}
                userRole={userRole}
              />
            ) : (
              <ProductScanner
                onInspectionComplete={handleInspectionComplete}
                onClearPreviousInspection={() => setActiveInspection(null)}
                userRole={userRole}
              />
            )}
          </>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            inspections={roleInspections}
            onSelectInspection={handleSelectInspection}
            onNewScan={handleNewScan}
            userRole={userRole}
          />
        )}

        {activeTab === 'repository' && (
          <RepositoryView
            inspections={roleInspections}
            onSelectInspection={handleSelectInspection}
            onDeleteInspection={handleDeleteInspection}
            onOpenPrintModal={(record) => setPrintModalInspection(record)}
            userRole={userRole}
          />
        )}

        {activeTab === 'rules_architecture' && (
          <TechnicalDocsView />
        )}
      </Layout>

      {/* Official Notice & Inspection Report Modal (PDF download) */}
      {printModalInspection && (
        <OfficialReportPrintModal
          inspection={printModalInspection}
          onClose={() => setPrintModalInspection(null)}
          userRole={userRole}
        />
      )}
    </>
  );
}