import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { HomeScreen } from './components/home/HomeScreen';
import { CreateRoomForm } from './components/home/CreateRoomForm';
import { JoinRoomForm } from './components/home/JoinRoomForm';
import { AboutScreen } from './components/home/AboutScreen';
import { LobbyScreen } from './components/lobby/LobbyScreen';

/**
 * Routes:
 *   /                 → Home (or auto-redirect to /join if ?code= is present)
 *   /create           → Create room form
 *   /join             → Join room form (also handles /?code=NNNNNN via redirect)
 *   /lobby/:code      → Lobby screen
 *   /about            → About / credits
 *   *                 → 404 → home
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeOrJoinRedirect />} />
      <Route path="/create" element={<CreateRoomForm />} />
      <Route path="/join" element={<JoinRoomForm />} />
      <Route path="/lobby/:code" element={<LobbyScreen />} />
      <Route path="/about" element={<AboutScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * If the user arrives at `/?code=482915` (from a shared link), forward them
 * straight to the join form with the code prefilled.
 */
function HomeOrJoinRedirect() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  if (code && /^\d{6}$/.test(code)) {
    return <Navigate to={`/join?code=${code}`} replace />;
  }
  return <HomeScreen />;
}
