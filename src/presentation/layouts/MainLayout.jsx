import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@presentation/components/Header/Header';
import Footer from '@presentation/components/Footer/Footer';
import LoginModal from '@presentation/components/AuthModals/LoginModal';
import RegisterModal from '@presentation/components/AuthModals/RegisterModal';
import OnboardingModal from '@presentation/components/OnboardingModal/OnboardingModal';
import api from '@services/api';

const MainLayout = () => {
  const location = useLocation();
  const [modal, setModal] = useState(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (location.state?.authError) {
      setAuthError(location.state.authError);
      setModal('login');
    }
  }, [location.state]);

  const closeModal = () => {
    setAuthError('');
    setModal(null);
  };

  const handleLoginSuccess = async () => {
    closeModal();
    try {
      const res = await api.get('/learner/onboarding');
      if (res.data.success && !res.data.data?.hasCompletedOnboarding) {
        setModal('onboarding');
      }
    } catch { }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onLoginClick={() => setModal('login')} />

      <main style={{ flex: 1 }}>
        <Outlet context={{
          openLogin:    () => setModal('login'),
          openRegister: () => setModal('register'),
          openOnboarding: () => setModal('onboarding'),
        }} />
      </main>

      <Footer />

      {modal === 'login' && (
        <LoginModal
          initialError={authError}
          onClose={closeModal}
          onSwitchToRegister={() => { setAuthError(''); setModal('register'); }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {modal === 'register' && (
        <RegisterModal
          onClose={closeModal}
          onSwitchToLogin={() => setModal('login')}
          onRegisterSuccess={() => setModal('onboarding')}
        />
      )}
      {modal === 'onboarding' && (
        <OnboardingModal onClose={closeModal} onComplete={closeModal} />
      )}
    </div>
  );
};

export default MainLayout;