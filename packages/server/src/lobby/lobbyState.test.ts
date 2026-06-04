import { describe, it, expect } from 'vitest';
import { MAX_PLAYERS } from '@werewolf/shared';
import {
  addPlayer,
  canStartGame,
  createEmptyLobby,
  dealCards,
  deckAsRecord,
  endGame,
  getDeckSize,
  getPlayersList,
  kickPlayer,
  markDisconnected,
  removePlayer,
  setCardCount,
  setPlayerReady,
  transferGm,
} from './lobbyState.js';
import { cryptoShuffle } from './shuffle.js';

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
    state = { ...state, phase: 'playing' };

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
    // Phase 4.1: deck must match NON-GM player count (n-1) for canStartGame to succeed.
    state = setCardCount(state, 'villager', n - 1);
    return { state, hostId };
  };

  it('allows start when 6 players are all ready and requester is host', () => {
    const { state, hostId } = buildReadyLobby(6);
    expect(canStartGame(state, hostId).ok).toBe(true);
  });

  it('rejects when fewer than 6 players', () => {
    const { state, hostId } = buildReadyLobby(5);
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
    // Add 5 non-GM players (6 total) but don't mark them ready
    for (let i = 1; i < 6; i++) {
      const sid = uuid();
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `P${i}`,
        isHost: false,
        now: NOW + i,
      })).state;
    }
    const r = canStartGame(state, hostId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('not_all_ready');
  });

  it('rejects when requester is not host', () => {
    const { state } = buildReadyLobby(6);
    const r = canStartGame(state, uuid());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('not_host');
  });

  it('rejects when already playing', () => {
    let { state, hostId } = buildReadyLobby(6);
    state = { ...state, phase: 'playing' };
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

// ---------- Phase 2.3: Room Desk ----------

describe('setCardCount', () => {
  it('adds a card with count 1 to empty deck', () => {
    const initial = createEmptyLobby('482915');
    expect(initial.roomDesk.size).toBe(0);
    const next = setCardCount(initial, 'werewolf', 1);
    expect(next.roomDesk.get('werewolf')).toBe(1);
    expect(next.roomDesk.size).toBe(1);
  });

  it('updates existing card count', () => {
    let state = createEmptyLobby('482915');
    state = setCardCount(state, 'werewolf', 2);
    state = setCardCount(state, 'werewolf', 5);
    expect(state.roomDesk.get('werewolf')).toBe(5);
    expect(state.roomDesk.size).toBe(1);
  });

  it('removes the card entirely when count is 0', () => {
    let state = createEmptyLobby('482915');
    state = setCardCount(state, 'werewolf', 3);
    expect(state.roomDesk.has('werewolf')).toBe(true);
    state = setCardCount(state, 'werewolf', 0);
    expect(state.roomDesk.has('werewolf')).toBe(false);
  });

  it('caps count at MAX_PLAYERS', () => {
    const state = setCardCount(createEmptyLobby('482915'), 'werewolf', 100);
    expect(state.roomDesk.get('werewolf')).toBe(MAX_PLAYERS);
  });

  it('does not mutate the original state', () => {
    const initial = createEmptyLobby('482915');
    const next = setCardCount(initial, 'werewolf', 1);
    expect(initial.roomDesk.size).toBe(0);
    expect(next.roomDesk.size).toBe(1);
  });
});

describe('getDeckSize', () => {
  it('returns 0 for empty deck', () => {
    const state = createEmptyLobby('482915');
    expect(getDeckSize(state)).toBe(0);
  });

  it('returns sum across all cards', () => {
    let state = createEmptyLobby('482915');
    state = setCardCount(state, 'werewolf', 2);
    state = setCardCount(state, 'villager', 4);
    state = setCardCount(state, 'seer', 1);
    expect(getDeckSize(state)).toBe(7);
  });
});

describe('deckAsRecord', () => {
  it('converts Map to plain Record', () => {
    let state = createEmptyLobby('482915');
    state = setCardCount(state, 'werewolf', 2);
    state = setCardCount(state, 'villager', 3);
    const record = deckAsRecord(state);
    expect(record).toEqual({ werewolf: 2, villager: 3 });
  });
});

describe('canStartGame with deck validation', () => {
  const buildBaseLobby = (n: number) => {
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

  it('rejects when deckSize !== nonGmCount with deck_mismatch reason', () => {
    // 6 players (1 GM + 5 non-GM), deck = 3 — mismatches non-GM count of 5
    let { state, hostId } = buildBaseLobby(6);
    state = setCardCount(state, 'villager', 3);
    const r = canStartGame(state, hostId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('deck_mismatch');
  });

  it('includes expected/actual counts in deck_mismatch result', () => {
    // 8 players (1 GM + 7 non-GM), deck = 5 — expected = 7 non-GM, actual = 5
    let { state, hostId } = buildBaseLobby(8);
    state = setCardCount(state, 'villager', 3);
    state = setCardCount(state, 'werewolf', 2);
    const r = canStartGame(state, hostId);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    if (r.reason !== 'deck_mismatch') return;
    expect(r.expected).toBe(7);
    expect(r.actual).toBe(5);
  });

  it('allows start when deckSize === nonGmCount with all ready (multi-card deck)', () => {
    // 6 players (1 GM + 5 non-GM), deck = 5 cards — matches non-GM count
    let { state, hostId } = buildBaseLobby(6);
    state = setCardCount(state, 'werewolf', 2);
    state = setCardCount(state, 'seer', 1);
    state = setCardCount(state, 'villager', 2);
    expect(canStartGame(state, hostId).ok).toBe(true);
  });
});

// ---------- Phase 2.4: Card Dealing ----------

describe('cryptoShuffle', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(cryptoShuffle(arr)).toHaveLength(5);
  });

  it('returns the same multiset (no elements lost or added)', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f'];
    const shuffled = cryptoShuffle(arr);
    expect([...shuffled].sort()).toEqual([...arr].sort());
  });

  it('does not mutate the input', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    cryptoShuffle(arr);
    expect(arr).toEqual(copy);
  });
});

describe('dealCards', () => {
  // Identity shuffle for deterministic tests
  const identity = <T,>(a: T[]): T[] => [...a];
  // Reverse shuffle for predictable reordering
  const reverse = <T,>(a: T[]): T[] => [...a].reverse();

  // ids[0] is always GM (isHost=true); ids[1..n-1] are non-GM players.
  const buildDealtLobby = (n: number, deck: Record<string, number>) => {
    let state = createEmptyLobby('482915');
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const sid = uuid();
      ids.push(sid);
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `P${i}`,
        isHost: i === 0,
        now: NOW + i,
      })).state;
    }
    for (const [cardId, count] of Object.entries(deck)) {
      state = setCardCount(state, cardId, count);
    }
    return { state, ids };
  };

  it('assigns one card to each non-GM player', () => {
    // 6 total (1 GM + 5 non-GM), deck = 5
    const { state } = buildDealtLobby(6, { villager: 5 });
    const dealt = dealCards(state, identity);
    expect(dealt.assignments.size).toBe(5);
  });

  it('dealt multiset equals deck composition', () => {
    // 6 total (1 GM + 5 non-GM), deck = 5
    const { state } = buildDealtLobby(6, { werewolf: 2, villager: 3 });
    const dealt = dealCards(state, identity);
    const cards = Array.from(dealt.assignments.values()).sort();
    expect(cards).toEqual(['villager', 'villager', 'villager', 'werewolf', 'werewolf']);
  });

  it('respects card counts (2 werewolves → exactly 2 players)', () => {
    // 6 total (1 GM + 5 non-GM), deck = 5
    const { state } = buildDealtLobby(6, { werewolf: 2, villager: 3 });
    const dealt = dealCards(state, identity);
    const wolves = Array.from(dealt.assignments.values()).filter((c) => c === 'werewolf');
    expect(wolves).toHaveLength(2);
  });

  it('transitions phase to playing', () => {
    // 6 total (1 GM + 5 non-GM), deck = 5
    const { state } = buildDealtLobby(6, { villager: 5 });
    const dealt = dealCards(state, identity);
    expect(dealt.phase).toBe('playing');
  });

  it('uses injected shuffle deterministically', () => {
    // 4 total (1 GM + 3 non-GM), deck = 3
    // ids[0] = GM (no card), ids[1..3] = non-GM
    const { state, ids } = buildDealtLobby(4, { werewolf: 1, seer: 1, villager: 1 });
    // flat order: [werewolf, seer, villager] (roomDesk insertion order)
    // reverse → [villager, seer, werewolf]
    // non-GM players ordered by joinedAt: ids[1], ids[2], ids[3]
    const dealt = dealCards(state, reverse);
    expect(dealt.assignments.get(ids[0]!)).toBeUndefined(); // GM gets no card
    expect(dealt.assignments.get(ids[1]!)).toBe('villager');
    expect(dealt.assignments.get(ids[2]!)).toBe('seer');
    expect(dealt.assignments.get(ids[3]!)).toBe('werewolf');
  });

  it('assignments.size === non-GM player count', () => {
    // 7 total (1 GM + 6 non-GM), deck = 6
    const { state } = buildDealtLobby(7, { werewolf: 2, seer: 1, villager: 3 });
    const dealt = dealCards(state, identity);
    expect(dealt.assignments.size).toBe(6);
  });

  it('returns unchanged if deck size != non-GM count', () => {
    // 5 total (1 GM + 4 non-GM), deck = 3 — 3 ≠ 4 → no deal
    const { state } = buildDealtLobby(5, { villager: 3 });
    const dealt = dealCards(state, identity);
    expect(dealt.phase).toBe('lobby'); // not dealt
    expect(dealt.assignments.size).toBe(0);
  });
});

// ---------- Phase 2.6: End Game ----------

describe('endGame', () => {
  // Identity shuffle for deterministic deal-then-end tests
  const identity = <T,>(a: T[]): T[] => [...a];

  /** Build a 6-player lobby (1 GM + 5 non-GM), all ready, deck = 5 cards, dealt → playing. */
  const buildPlayingLobby = () => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;
    state = setPlayerReady(state, hostId, true)!.state;
    const playerIds: string[] = [hostId];
    for (let i = 1; i < 6; i++) {
      const sid = uuid();
      playerIds.push(sid);
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `P${i}`,
        isHost: false,
        now: NOW + i,
      })).state;
      state = setPlayerReady(state, sid, true)!.state;
    }
    // 5 cards for 5 non-GM players
    state = setCardCount(state, 'werewolf', 2);
    state = setCardCount(state, 'villager', 3);
    state = dealCards(state, identity);
    return { state, hostId, playerIds };
  };

  it('transitions phase from playing to lobby', () => {
    const { state } = buildPlayingLobby();
    expect(state.phase).toBe('playing');
    const ended = endGame(state);
    expect(ended.phase).toBe('lobby');
  });

  it('clears assignments completely', () => {
    const { state } = buildPlayingLobby();
    expect(state.assignments.size).toBe(5); // 5 non-GM players dealt
    const ended = endGame(state);
    expect(ended.assignments.size).toBe(0);
  });

  it('preserves roomDesk unchanged', () => {
    const { state } = buildPlayingLobby();
    const beforeDesk = deckAsRecord(state);
    const ended = endGame(state);
    expect(deckAsRecord(ended)).toEqual(beforeDesk);
  });

  it('resets isReady to false for non-host players', () => {
    const { state, hostId } = buildPlayingLobby();
    const ended = endGame(state);
    for (const [sid, p] of ended.players) {
      if (sid !== hostId) {
        expect(p.isReady).toBe(false);
      }
    }
  });

  it('keeps host isReady true after end_game', () => {
    const { state, hostId } = buildPlayingLobby();
    const ended = endGame(state);
    const hostPlayer = ended.players.get(hostId);
    expect(hostPlayer?.isReady).toBe(true);
  });

  it('does not mutate the original state', () => {
    const { state } = buildPlayingLobby();
    const phaseBefore = state.phase;
    const assignmentsSizeBefore = state.assignments.size;
    endGame(state);
    expect(state.phase).toBe(phaseBefore);
    expect(state.assignments.size).toBe(assignmentsSizeBefore);
  });
});

// ---------- Phase 4.1: GM Transfer ----------

describe('transferGm', () => {
  const buildLobbyWithPlayers = (n: number) => {
    let state = createEmptyLobby('482915');
    const hostId = uuid();
    state = mustAdd(addPlayer(state, {
      sessionId: hostId,
      displayName: 'Host',
      isHost: true,
      now: NOW,
    })).state;
    const playerIds: string[] = [hostId];
    for (let i = 1; i < n; i++) {
      const sid = uuid();
      playerIds.push(sid);
      state = mustAdd(addPlayer(state, {
        sessionId: sid,
        displayName: `P${i}`,
        isHost: false,
        now: NOW + i,
      })).state;
    }
    return { state, hostId, playerIds };
  };

  it('transfer in lobby succeeds and swaps GM role', () => {
    const { state, hostId, playerIds } = buildLobbyWithPlayers(3);
    const targetId = playerIds[1]!;
    const result = transferGm(state, { requesterId: hostId, targetId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.hostSessionId).toBe(targetId);
    expect(result.state.players.get(targetId)!.isHost).toBe(true);
    expect(result.state.players.get(targetId)!.isReady).toBe(true);
    expect(result.state.players.get(hostId)!.isHost).toBe(false);
    expect(result.state.players.get(hostId)!.isReady).toBe(false);
  });

  it('returns updated oldGm and newGm for broadcast', () => {
    const { state, hostId, playerIds } = buildLobbyWithPlayers(3);
    const targetId = playerIds[2]!;
    const result = transferGm(state, { requesterId: hostId, targetId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.oldGm.sessionId).toBe(hostId);
    expect(result.oldGm.isHost).toBe(false);
    expect(result.newGm.sessionId).toBe(targetId);
    expect(result.newGm.isHost).toBe(true);
  });

  it('rejects transfer during playing phase', () => {
    let { state, hostId, playerIds } = buildLobbyWithPlayers(3);
    state = { ...state, phase: 'playing' };
    const result = transferGm(state, { requesterId: hostId, targetId: playerIds[1]! });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('wrong_phase');
  });

  it('rejects when requester is not GM', () => {
    const { state, playerIds } = buildLobbyWithPlayers(3);
    const nonGm = playerIds[1]!;
    const target = playerIds[2]!;
    const result = transferGm(state, { requesterId: nonGm, targetId: target });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('not_host');
  });

  it('rejects transfer to self', () => {
    const { state, hostId } = buildLobbyWithPlayers(2);
    const result = transferGm(state, { requesterId: hostId, targetId: hostId });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('cannot_transfer_to_self');
  });

  it('rejects transfer to non-existent player', () => {
    const { state, hostId } = buildLobbyWithPlayers(2);
    const result = transferGm(state, { requesterId: hostId, targetId: uuid() });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('target_not_found');
  });
});
