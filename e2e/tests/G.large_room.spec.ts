import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import { newPlayerContext, createRoomAsHost, joinRoomAsPlayer, waitForRealtime } from './helpers';

const TOTAL_PLAYERS = 20;
const TOTAL_GAMES = 5;
const WOLF_COUNT = 4;
const VILLAGER_COUNT = 15; // Phase 4.1: deck matches non-GM count (19 = 4 wolves + 15 villagers)

const PLAYER_SEED: { name: string; avatarId: string }[] = [
  { name: 'Alice',   avatarId: 'wolf'  },
  { name: 'Bob',     avatarId: 'fox'   },
  { name: 'Charlie', avatarId: 'owl'   },
  { name: 'Diana',   avatarId: 'cat'   },
  { name: 'Eve',     avatarId: 'bear'  },
  { name: 'Frank',   avatarId: 'wolf'  },
  { name: 'Grace',   avatarId: 'fox'   },
  { name: 'Hank',    avatarId: 'owl'   },
  { name: 'Iris',    avatarId: 'cat'   },
  { name: 'Jack',    avatarId: 'bear'  },
  { name: 'Karen',   avatarId: 'wolf'  },
  { name: 'Leo',     avatarId: 'fox'   },
  { name: 'Mia',     avatarId: 'owl'   },
  { name: 'Ned',     avatarId: 'cat'   },
  { name: 'Olivia',  avatarId: 'bear'  },
  { name: 'Pete',    avatarId: 'wolf'  },
  { name: 'Quinn',   avatarId: 'fox'   },
  { name: 'Rose',    avatarId: 'owl'   },
  { name: 'Sam',     avatarId: 'cat'   },
  { name: 'Tina',    avatarId: 'bear'  },
];

const editorIncrementBtn = (cardName: string) =>
  new RegExp(`^${cardName}, hiện \\d+\\. Bấm để thêm`);

test.describe('G. Large room — 20 players, 5 games', () => {
  test.beforeAll(() => {
    fs.mkdirSync('screenshots', { recursive: true });
  });

  test(
    'G1: 20-player room plays 5 consecutive games with per-game screenshots',
    async ({ browser }) => {
      // 10 min: 20 contexts joining + 5 × (ready loop + 10s transition + gameplay)
      test.setTimeout(600_000);

      // ── 1. Spin up host ───────────────────────────────────────────────────
      const ctxs: { ctx: BrowserContext; page: Page; name: string }[] = [];

      const hostSeed = PLAYER_SEED[0];
      const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
        displayName: hostSeed.name,
        avatarId: hostSeed.avatarId,
      });
      const code = await createRoomAsHost(hostPage, {
        name: hostSeed.name,
        avatarId: hostSeed.avatarId,
      });
      ctxs.push({ ctx: hostCtx, page: hostPage, name: hostSeed.name });

      // ── 2. Join remaining 19 players ─────────────────────────────────────
      for (let i = 1; i < TOTAL_PLAYERS; i++) {
        const seed = PLAYER_SEED[i];
        const { context, page } = await newPlayerContext(browser, {
          displayName: seed.name,
          avatarId: seed.avatarId,
        });
        await joinRoomAsPlayer(page, code, { name: seed.name, avatarId: seed.avatarId });
        ctxs.push({ ctx: context, page, name: seed.name });
      }

      // Let all join events propagate
      await waitForRealtime(hostPage, 2500);

      // Verify all 20 names visible on host's lobby
      for (const { name } of ctxs) {
        await expect(hostPage.getByText(name, { exact: false })).toBeVisible({ timeout: 8_000 });
      }

      // ── 3. Configure deck once: 4 wolves + 16 villagers ──────────────────
      await hostPage.getByRole('button', { name: /Sửa bộ bài/i }).click();
      await waitForRealtime(hostPage, 500);

      for (let i = 0; i < WOLF_COUNT; i++) {
        await hostPage.getByRole('button', { name: editorIncrementBtn('Sói Thường') }).click();
        await waitForRealtime(hostPage, 150);
      }
      for (let i = 0; i < VILLAGER_COUNT; i++) {
        await hostPage.getByRole('button', { name: editorIncrementBtn('Dân Làng') }).click();
        await waitForRealtime(hostPage, 150);
      }

      await hostPage.getByRole('button', { name: /Quay lại lobby/i }).click();
      await waitForRealtime(hostPage, 800);

      // ── 4. Play 5 games ───────────────────────────────────────────────────
      const allPages = ctxs.map(c => c.page);
      const nonHostPages = allPages.slice(1);

      for (let game = 1; game <= TOTAL_GAMES; game++) {
        const prefix = `screenshots/G1_game${game}`;

        // -- Ready up ----------------------------------------------------------
        for (const page of nonHostPages) {
          const readyBtn = page.getByRole('button', { name: /Tôi đã sẵn sàng/i });
          if (await readyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await readyBtn.click();
          }
          await waitForRealtime(page, 200);
        }
        await waitForRealtime(hostPage, 2_500);

        await hostPage.screenshot({ path: `${prefix}_01_lobby_ready.png` });

        // -- Start game --------------------------------------------------------
        const startBtn = hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ });
        await expect(startBtn).toBeEnabled({ timeout: 8_000 });
        await startBtn.click();

        await expect(hostPage.locator('video').first()).toBeVisible({ timeout: 10_000 });
        await hostPage.screenshot({ path: `${prefix}_02_transition.png` });

        await waitForRealtime(hostPage, 13_000);

        // Phase 4.2: GM view now shows turn indicator instead of static placeholder
        await expect(hostPage.getByRole('button', { name: /Kết thúc đêm/i })).toBeVisible({ timeout: 8_000 });
        await hostPage.screenshot({ path: `${prefix}_03_playing.png` });

        const samplePage = nonHostPages[(game - 1) % nonHostPages.length];
        await expect(
          samplePage.getByText(/VAI CỦA BẠN|Giữ vào card|Đang nhận bài/i).first(),
        ).toBeVisible({ timeout: 8_000 });
        await samplePage.screenshot({ path: `${prefix}_03_playing_player_view.png` });

        // -- End game ----------------------------------------------------------
        const endBtn = hostPage.getByRole('button', { name: /Kết thúc trận/i });
        await expect(endBtn).toBeVisible({ timeout: 8_000 });
        await endBtn.click();

        await waitForRealtime(hostPage, 2_500);
        await expect(
          hostPage.getByText(/(Sẵn sàng|Đang nghĩ)/).first(),
        ).toBeVisible({ timeout: 10_000 });

        await hostPage.screenshot({ path: `${prefix}_04_back_to_lobby.png` });
      }

      // ── 5. Final evidence: 20 players still in lobby ─────────────────────
      await hostPage.screenshot({ path: 'screenshots/G1_final_20players_lobby.png' });

      // ── 6. Cleanup ────────────────────────────────────────────────────────
      for (const { ctx } of ctxs) await ctx.close();
    },
  );
});
