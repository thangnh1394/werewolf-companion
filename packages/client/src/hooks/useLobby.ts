import { useCallback, useEffect, useMemo, useRef } from 'react';
import PartySocket from 'partysocket';
import { useMachine } from '@xstate/react';
import type { ClientMessage, SessionId } from '@werewolf/shared';
import { lobbyMachine } from '../machines/lobbyMachine';
import { getPartyKitHost, parseServerMessage, sendMessage } from '../lib/ws';
import { getOrCreateSessionId } from '../lib/storage';

interface UseLobbyArgs {
  roomCode: string;
  displayName: string;
  isHost: boolean;
}

/**
 * Manages the WebSocket connection and lobby state for a single room.
 *
 * - Opens a PartySocket to /parties/lobby/<roomCode>
 * - Sends JOIN immediately on connect
 * - Drives the lobbyMachine on every server message
 * - Reopens (partysocket auto-reconnects) on disconnect
 * - Returns derived UI state + action callbacks
 */
export function useLobby({ roomCode, displayName, isHost }: UseLobbyArgs) {
  const sessionId = useMemo(() => getOrCreateSessionId() as SessionId, []);

  const [state, send] = useMachine(lobbyMachine, {
    input: { roomCode },
  });

  const socketRef = useRef<PartySocket | null>(null);
  const isTerminatedRef = useRef(false);

  // Open the socket once, keep it alive for the component's lifetime.
  useEffect(() => {
    const socket = new PartySocket({
      host: getPartyKitHost(),
      party: 'lobby',
      room: roomCode,
    });
    socketRef.current = socket;

    const handleOpen = () => {
      if (isTerminatedRef.current) {
        socket.close();
        return;
      }
      sendMessage(socket, {
        type: 'JOIN',
        sessionId,
        displayName,
        isHost,
      } as ClientMessage);
      send({ type: 'CONNECTION_RESTORED' });
    };

    const handleMessage = (e: MessageEvent<string>) => {
      const msg = parseServerMessage(e.data);
      if (!msg) return;
      if (msg.type === 'KICKED' || msg.type === 'ROOM_CLOSED') {
        isTerminatedRef.current = true;
      }
      send(msg as never);
    };

    const handleClose = () => {
      send({ type: 'CONNECTION_LOST' });
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('close', handleClose);

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close', handleClose);
      // Send a voluntary leave if still connected, to release the player slot
      // immediately rather than waiting for the server's disconnect detection.
      try {
        if (socket.readyState === WebSocket.OPEN) {
          sendMessage(socket, { type: 'LEAVE_ROOM' });
        }
      } catch {
        // ignore
      }
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode, sessionId, displayName, isHost, send]);

  const setReady = useCallback((isReady: boolean) => {
    const s = socketRef.current;
    if (s) sendMessage(s, { type: 'SET_READY', isReady });
  }, []);

  const kickPlayer = useCallback((targetSessionId: string) => {
    const s = socketRef.current;
    if (s) sendMessage(s, { type: 'KICK_PLAYER', targetSessionId: targetSessionId as SessionId });
  }, []);

  const startGame = useCallback(() => {
    const s = socketRef.current;
    if (s) sendMessage(s, { type: 'START_GAME' });
  }, []);

  const leave = useCallback(() => {
    const s = socketRef.current;
    if (s) sendMessage(s, { type: 'LEAVE_ROOM' });
  }, []);

  return {
    phase: state.value as
      | 'connecting'
      | 'in_lobby'
      | 'disconnected'
      | 'joining_error'
      | 'kicked'
      | 'room_closed'
      | 'game_starting',
    context: state.context,
    actions: { setReady, kickPlayer, startGame, leave },
    sessionId,
  };
}
