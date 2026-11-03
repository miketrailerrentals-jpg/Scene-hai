import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { RightRail } from './components/RightRail';
import { MobileNav } from './components/MobileNav';
import { Toast } from './components/Toast';
import { AuthModal } from './components/modals/AuthModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { MigrationModal } from './components/modals/MigrationModal';
import { EditSceneModal } from './components/modals/EditSceneModal';

import { DiscoverView } from './views/DiscoverView';
import { ExploreView } from './views/ExploreView';
import { CreateView } from './views/CreateView';
import { MyScenesView } from './views/MyScenesView';
import { InboxView } from './views/InboxView';
import { CommunityView } from './views/CommunityView';
import { ProfileView } from './views/ProfileView';
import { SafetyView } from './views/SafetyView';
import { SceneDetailView } from './views/SceneDetailView';
import { ChatView } from './views/ChatView';
import { Icon } from './icons';

const MainContent: React.FC = () => {
  const { currentRoute, navigate } = useApp();

  if (currentRoute === 'discover') return <DiscoverView />;
  if (currentRoute === 'explore') return <ExploreView />;
  if (currentRoute === 'create') return <CreateView />;
  if (currentRoute === 'my-scenes') return <MyScenesView />;
  if (currentRoute === 'inbox') return <InboxView />;
  if (currentRoute === 'community') return <CommunityView />;
  if (currentRoute === 'profile') return <ProfileView />;
  if (currentRoute === 'safety') return <SafetyView />;

  if (currentRoute.startsWith('scene/')) {
    const sceneId = currentRoute.replace('scene/', '');
    return <SceneDetailView sceneId={sceneId} />;
  }

  if (currentRoute.startsWith('chat/')) {
    const sceneId = currentRoute.replace('chat/', '');
    return <ChatView sceneId={sceneId} />;
  }

  return (
    <div className="view empty-state">
      <h1>Scene not found</h1>
      <p>It might have been removed.</p>
      <button
        type="button"
        className="button dark"
        onClick={() => navigate('discover')}
      >
        Back home <Icon name="arrow" size={17} />
      </button>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <>
      <div className="app-shell">
        <Sidebar />
        <div className="center-shell">
          <Topbar />
          <main id="main-content">
            <MainContent />
          </main>
          <footer className="main-footer">
            The best things happen offline. <span>✳</span> See you out there.
          </footer>
        </div>
        <RightRail />
      </div>

      <MobileNav />
      <Toast />
      <AuthModal />
      <EditProfileModal />
      <MigrationModal />
      <EditSceneModal />
    </>
  );
};

export default App;
