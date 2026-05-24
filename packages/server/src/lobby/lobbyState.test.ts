import { describe, it, expect } from 'vitest';
import { MAX_PLAYERS } from '@werewolf/shared';
import {
  addPlayer,
  canStartGame,
  createEmptyLobby,
  getPlayersList,
  kickPlayer,
  markDisconnected,
  removePlayer,
  setPlayerReady,
  startGame,
} from './lobbyState.js';

const NOW = 1_700_000_000_000;
const uuid = () => crypto.randomUUID();

/** Test helper — fails the test if addPlayer returned an error. */
function mustAdd(
  result: ReturnType<typeof addPlayer>,
): { state: ReturnType<typeof createEmptyLobby>; player: import('@werewolf/shared').PublicPlayer } {
  if (!result.ok) {
    throw new Error(`Expected addPlayer to succeed but got: ${result.reason}`);
  }
  return { state: result.state, player: result.player };
}

describe('createEmptyLobby', () => {
  it('initializes with no players and lobby phase', () => {
    const state = createEmptyLobby('482915');
    expect(state.roomCode).toBe('482915');
    expect(state.phase).toBe('lobby');
    expect(state.players.size).toBe(0);
    expect(state.hostSessionId).toBeNull();
    expect(state.hostDisconnectedAt).toBeNull();
  });
});

describe('addPlayer', () => {
  it('adds the first player as host when isHost=true', () => {
    const state = createEmptyLobby('482915');
    const sid = uuid();
    const result = addPlayer(state, {
      sessionId: sid,
      displayName: 'Hoàng',
      isHost: true,
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.player.isHost).toBe(true);
    expect(result.player.displayName).toBe('Hoàng');
    expect(result.state.hostSessionId).toBe(sid);
    expect(result.state.players.size).toBe(1);
  });

  it('does not assign host when isHost=false even if first', () => {
    const state = createEmptyLobby('482915');
    const result = addPlayer(state, {
      sessionId: uuid(),
      displayName: 'Bình',
      isHost: false,
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.player.isHost).toBe(false);
    expect(result.state.hostSessionId).toBeNull();
  });

  it('does not promote second player to host even if they claim isHost=true', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Hoàng',
      isHost: true,
      now: NOW,
    })).state;

    const result = addPlayer(state, {
      sessionId: uuid(),
      displayName: 'Bình',
      isHost: true, // sneaky claim
      now: NOW + 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.player.isHost).toBe(false);
    expect(result.state.hostSessionId).toBe(hostId);
  });

  it('rejects join when room is full', () => {
    let state = createEmptyLobby('482915');
    for (let i = 0; i < MAX_PLAYERS; i++) {
      state = mustAdd(addPlayer(state, {
        sessionId: uuid(),
        displayName: `Player${i}`,
        isHost: i === 0,
        now: NOW + i,
      })).state;
    }
    const result = addPlayer(state, {
      sessionId: uuid(),
      displayName: 'TooMany',
      isHost: false,
      now: NOW + 1000,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('room_full');
  });

  it('rejects join when phase is playing', () => {
    let state = createEmptyLobby('482915');
    state = mustAdd(addPlayer(state, {
      sessionId: uuid(),
      displayName: 'Hoàng',
      isHost: true,
      now: NOW,
    })).state;
    state = startGame(state);

    const result = addPlayer(state, {
      sessionId: uuid(),
      displayName: 'Late',
      isHost: false,
      now: NOW + 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('room_in_progress');
  });

  it('treats same sessionId as a rejoin and keeps host status', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Hoàng',
      isHost: true,
      now: NOW,
    })).state;
    state = markDisconnected(state, hostId, NOW + 500);

    const rejoin = addPlayer(state, {
      sessionId: hostId,
      displayName: 'Hoàng', // same name
      isHost: true,
      now: NOW + 1000,
    });
    expect(rejoin.ok).toBe(true);
    if (!rejoin.ok) return;
    expect(rejoin.player.isHost).toBe(true);
    expect(rejoin.player.isConnected).toBe(true);
    expect(rejoin.state.hostDisconnectedAt).toBeNull();
  });

  it('allows rejoin even when room is at MAX_PLAYERS', () => {
    let state = createEmptyLobby('482915');
    const sessionIds: string[] = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const sid = uuid();
      sessionIds.push(sid);
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `Player${i}`,
        isHost: i === 0,
        now: NOW + i,
      })).state;
    }
    // Pick a non-host player to disconnect and rejoin.
    const targetSid = sessionIds[5]!;
    state = markDisconnected(state, targetSid, NOW + 1000);

    const rejoin = addPlayer(state, {
      sessionId: targetSid,
      displayName: 'Player5',
      isHost: false,
      now: NOW + 2000,
    });
    expect(rejoin.ok).toBe(true);
  });

  it('updates the display name on rejoin', () => {
    let state = createEmptyLobby('482915');
    const sid = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: sid,
      displayName: 'OldName',
      isHost: true,
      now: NOW,
    })).state;

    const rejoin = addPlayer(state, {
      sessionId: sid,
      displayName: 'NewName',
      isHost: true,
      now: NOW + 100,
    });
    expect(rejoin.ok).toBe(true);
    if (!rejoin.ok) return;
    expect(rejoin.player.displayName).toBe('NewName');
  });
});

describe('setPlayerReady', () => {
  it('toggles a player ready state', () => {
    let state = createEmptyLobby('482915');
    const sid = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: sid,
      displayName: 'X',
      isHost: true,
      now: NOW,
    })).state;

    const r1 = setPlayerReady(state, sid, true);
    expect(r1).not.toBeNull();
    expect(r1!.player.isReady).toBe(true);

    const r2 = setPlayerReady(r1!.state, sid, false);
    expect(r2!.player.isReady).toBe(false);
  });

  it('returns null for non-existent player', () => {
    const state = createEmptyLobby('482915');
    expect(setPlayerReady(state, uuid(), true)).toBeNull();
  });
});

describe('kickPlayer', () => {
  it('host can kick another player', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    const targetId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;
    state = mustAdd(addPlayer(state, {
      sessionId: targetId,
      displayName: 'Victim',
      isHost: false,
      now: NOW + 1,
    })).state;

    const result = kickPlayer(state, { requesterId: hostId, targetId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players.has(targetId)).toBe(false);
    expect(result.state.players.size).toBe(1);
  });

  it('non-host cannot kick', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    const playerA = uuid();
    const playerB = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;
    state = mustAdd(addPlayer(state, {
      sessionId: playerA,
      displayName: 'A',
      isHost: false,
      now: NOW + 1,
    })).state;
    state = mustAdd(addPlayer(state, {
      sessionId: playerB,
      displayName: 'B',
      isHost: false,
      now: NOW + 2,
    })).state;

    const result = kickPlayer(state, { requesterId: playerA, targetId: playerB });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('not_host');
  });

  it('host cannot kick themselves', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;

    const result = kickPlayer(state, { requesterId: hostId, targetId: hostId });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('cannot_kick_self');
  });

  it('returns error when target does not exist', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;

    const result = kickPlayer(state, { requesterId: hostId, targetId: uuid() });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('target_not_found');
  });
});

describe('canStartGame', () => {
  const buildReadyLobby = (n: number) => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;
    state = setPlayerReady(state, hostId, true)!.state;
    for (let i = 1; i < n; i++) {
      const sid = uuid();
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `P${i}`,
        isHost: false,
        now: NOW + i,
      })).state;
      state = setPlayerReady(state, sid, true)!.state;
    }
    return { state, hostId };
  };

  it('allows start when 5 players are all ready and requester is host', () => {
    const { state, hostId } = buildReadyLobby(5);
    expect(canStartGame(state, hostId).ok).toBe(true);
  });

  it('rejects when fewer than 5 players', () => {
    const { state, hostId } = buildReadyLobby(4);
    const r = canStartGame(state, hostId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('not_enough_players');
  });

  it('rejects when someone is not ready', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;
    state = setPlayerReady(state, hostId, true)!.state;
    for (let i = 1; i < 5; i++) {
      const sid = uuid();
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `P${i}`,
        isHost: false,
        now: NOW + i,
      })).state;
      // Don't mark them ready
    }
    const r = canStartGame(state, hostId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('not_all_ready');
  });

  it('rejects when requester is not host', () => {
    const { state } = buildReadyLobby(5);
    const r = canStartGame(state, uuid());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('not_host');
  });

  it('rejects when already playing', () => {
    let { state, hostId } = buildReadyLobby(5);
    state = startGame(state);
    const r = canStartGame(state, hostId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('already_playing');
  });
});

describe('markDisconnected', () => {
  it('marks player as disconnected without removing them', () => {
    let state = createEmptyLobby('482915');
    const sid = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: sid,
      displayName: 'X',
      isHost: true,
      now: NOW,
    })).state;

    state = markDisconnected(state, sid, NOW + 1000);
    expect(state.players.get(sid)!.isConnected).toBe(false);
    expect(state.hostDisconnectedAt).toBe(NOW + 1000);
  });

  it('sets hostDisconnectedAt only for host', () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    const playerId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'H',
      isHost: true,
      now: NOW,
    })).state;
    state = mustAdd(addPlayer(state, {
      sessionId: playerId,
      displayName: 'P',
      isHost: false,
      now: NOW + 1,
    })).state;

    state = markDisconnected(state, playerId, NOW + 100);
    expect(state.hostDisconnectedAt).toBeNull();
    expect(state.players.get(playerId)!.isConnected).toBe(false);
  });
});

describe('removePlayer', () => {
  it('removes a player from the map', () => {
    let state = createEmptyLobby('482915');
    const sid = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: sid,
      displayName: 'X',
      isHost: false,
      now: NOW,
    })).state;
    state = removePlayer(state, sid);
    expect(state.players.has(sid)).toBe(false);
  });

  it('is a no-op for non-existent player', () => {
    const state = createEmptyLobby('482915');
    const after = removePlayer(state, uuid());
    expect(after).toEqual(state);
  });
});

describe('getPlayersList', () => {
  it('returns players sorted by joinedAt ascending', () => {
    let state = createEmptyLobby('482915');
    const a = uuid();
    const b = uuid();
    const c = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: b,
      displayName: 'B',
      isHost: true,
      now: 200,
    })).state;
    state = mustAdd(addPlayer(state, {
      sessionId: a,
      displayName: 'A',
      isHost: false,
      now: 100,
    })).state;
    state = mustAdd(addPlayer(state, {
      sessionId: c,
      displayName: 'C',
      isHost: false,
      now: 300,
    })).state;

    const list = getPlayersList(state);
    // Sorted ascending by joinedAt: A(100), B(200), C(300)
    expect(list.map((p) => p.displayName)).toEqual(['A', 'B', 'C']);
  });
});
