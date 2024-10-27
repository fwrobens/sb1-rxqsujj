import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import AuthPage from './pages/AuthPage';
import ChatApp from './pages/ChatApp';
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      {user ? <ChatApp /> : <AuthPage />}
      <Toaster />
    </>
  );
}

export default App;