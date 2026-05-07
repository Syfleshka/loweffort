// ── Game constants ──────────────────────────────────────────
const BOARD_SIZE = 10;
const FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const COIN_REWARD_MISS = 50;
const COIN_REWARD_HIT = 100;
const COST_MINE = 200;
const COST_RADAR = 150;
const COST_AIRSTRIKE = 500;
// ── Game logic (shared with client) ────────────────────────
function shipCells(ship) {
    const cells = [];
    for (let i = 0; i < ship.size; i++) {
        cells.push({
            x: ship.orientation === 'h' ? ship.x + i : ship.x,
            y: ship.orientation === 'v' ? ship.y + i : ship.y,
        });
    }
    return cells;
}
function inBounds(c) {
    return c.x >= 0 && c.x < BOARD_SIZE && c.y >= 0 && c.y < BOARD_SIZE;
}
function neighbors(c) {
    const out = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0)
                continue;
            out.push({ x: c.x + dx, y: c.y + dy });
        }
    }
    return out;
}
function ck(c) { return `${c.x},${c.y}`; }
function xy(x, y) { return `${x},${y}`; }
function validateGeometry(ships) {
    const occupied = new Set();
    const buffered = new Set();
    for (const ship of ships) {
        const cells = shipCells(ship);
        for (const c of cells) {
            if (!inBounds(c))
                return { ok: false, reason: 'Цыплёнок за пределами поля' };
            if (occupied.has(ck(c)))
                return { ok: false, reason: 'Цыплята пересекаются' };
            if (buffered.has(ck(c)))
                return { ok: false, reason: 'Цыплята слишком близко друг к другу' };
        }
        for (const c of cells) {
            occupied.add(ck(c));
            for (const n of neighbors(c)) {
                if (inBounds(n))
                    buffered.add(ck(n));
            }
        }
    }
    return { ok: true };
}
function validatePlacement(ships) {
    const expected = [...FLEET].sort((a, b) => b - a);
    const actual = ships.map((s) => s.size).sort((a, b) => b - a);
    if (expected.length !== actual.length || expected.some((v, i) => v !== actual[i])) {
        return { ok: false, reason: 'Неверный состав флота' };
    }
    return validateGeometry(ships);
}
function makeBoardState(ships) {
    return { ships, hits: new Map(), shots: new Map() };
}
function shoot(board, x, y) {
    const k = xy(x, y);
    if (board.shots.has(k))
        return { result: 'miss', alreadyShot: true };
    board.shots.set(k, true);
    for (const ship of board.ships) {
        const cells = shipCells(ship);
        if (cells.some((c) => c.x === x && c.y === y)) {
            board.hits.set(k, true);
            const allHit = cells.every((c) => board.hits.has(ck(c)));
            if (allHit) {
                const surrounding = new Set();
                for (const c of cells) {
                    for (const n of neighbors(c)) {
                        if (!inBounds(n))
                            continue;
                        if (cells.some((cc) => cc.x === n.x && cc.y === n.y))
                            continue;
                        const nk = ck(n);
                        if (!board.shots.has(nk)) {
                            board.shots.set(nk, true);
                            surrounding.add(nk);
                        }
                    }
                }
                const surroundingMisses = [...surrounding].map((s) => {
                    const [sx, sy] = s.split(',').map(Number);
                    return { x: sx, y: sy };
                });
                const allSunk = board.ships.every((sh) => shipCells(sh).every((c) => board.hits.has(ck(c))));
                return { result: 'kill', killedShipCells: cells, surroundingMisses, allSunk };
            }
            return { result: 'hit' };
        }
    }
    return { result: 'miss' };
}
class BsRoom {
    id;
    code;
    players = [];
    turn = null; // userId whose turn it is
    gameStarted = false;
    gameOver = false;
    bonusTurns = new Map();
    constructor(id, code) {
        this.id = id;
        this.code = code;
    }
    isFull() { return this.players.length >= 2; }
    isEmpty() { return this.players.length === 0; }
    addPlayer(userId, socketId) {
        if (this.isFull())
            return false;
        this.players.push({ userId, socketId, board: null, ready: false, rematch: false, coins: 0, mines: new Map() });
        return true;
    }
    updateSocket(userId, socketId) {
        const p = this.players.find((p) => p.userId === userId);
        if (p)
            p.socketId = socketId;
    }
    removePlayer(userId, io) {
        const idx = this.players.findIndex((p) => p.userId === userId);
        if (idx === -1)
            return;
        this.players.splice(idx, 1);
        if (this.players.length > 0) {
            io.to(this.players[0].socketId).emit('bs:opponent_left');
            this.resetGame();
        }
    }
    resetGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.turn = null;
        this.bonusTurns.clear();
        for (const p of this.players) {
            p.board = null;
            p.ready = false;
            p.rematch = false;
            p.coins = 0;
            p.mines.clear();
        }
    }
    notifyBothOpponentJoined(io) {
        for (const p of this.players) {
            io.to(p.socketId).emit('bs:opponent_joined');
        }
    }
    handleReady(userId, ships, io) {
        const player = this.players.find((p) => p.userId === userId);
        if (!player)
            return;
        if (this.gameStarted) {
            io.to(player.socketId).emit('bs:error', { message: 'Игра уже идёт' });
            return;
        }
        const v = validatePlacement(ships);
        if (!v.ok) {
            io.to(player.socketId).emit('bs:placement_invalid', { reason: v.reason ?? 'Неверная расстановка' });
            return;
        }
        player.board = makeBoardState(ships.map((s) => ({ ...s })));
        player.ready = true;
        player.coins = 0;
        player.mines.clear();
        const opp = this.opp(userId);
        if (!opp?.ready) {
            io.to(player.socketId).emit('bs:waiting_opponent');
            return;
        }
        this.gameStarted = true;
        this.gameOver = false;
        this.bonusTurns.clear();
        this.turn = this.players[Math.floor(Math.random() * 2)].userId;
        for (const p of this.players) {
            io.to(p.socketId).emit('bs:game_start', { yourTurn: p.userId === this.turn, coins: p.coins });
        }
    }
    handleShoot(userId, x, y, io) {
        const player = this.players.find((p) => p.userId === userId);
        if (!player)
            return;
        if (!this.gameStarted || this.gameOver) {
            io.to(player.socketId).emit('bs:error', { message: 'Сейчас не ваш ход' });
            return;
        }
        if (this.turn !== userId) {
            io.to(player.socketId).emit('bs:error', { message: 'Сейчас ход соперника' });
            return;
        }
        const opp = this.opp(userId);
        if (!opp?.board) {
            io.to(player.socketId).emit('bs:error', { message: 'Соперник не готов' });
            return;
        }
        const k = xy(x, y);
        const outcome = shoot(opp.board, x, y);
        if (outcome.alreadyShot) {
            io.to(player.socketId).emit('bs:error', { message: 'Вы уже сюда стреляли' });
            return;
        }
        const mineTriggered = opp.mines.has(k);
        if (mineTriggered)
            opp.mines.delete(k);
        player.coins += outcome.result === 'miss' ? COIN_REWARD_MISS : COIN_REWARD_HIT;
        const base = {
            x, y,
            result: outcome.result,
            killedShip: outcome.killedShipCells,
            surroundingMisses: outcome.surroundingMisses,
            mineTriggered: mineTriggered || undefined,
        };
        io.to(player.socketId).emit('bs:shot_result', { ...base, byYou: true, coins: player.coins });
        io.to(opp.socketId).emit('bs:shot_result', { ...base, byYou: false });
        if (outcome.allSunk) {
            this.endGame(userId, io);
            return;
        }
        if (mineTriggered) {
            this.turn = opp.userId;
            this.bonusTurns.set(opp.userId, (this.bonusTurns.get(opp.userId) ?? 0) + 1);
        }
        else if (outcome.result === 'miss') {
            this.passTurn(userId);
        }
        this.broadcastTurn(io);
    }
    handlePlaceMine(userId, x, y, io) {
        const player = this.players.find((p) => p.userId === userId);
        if (!player?.board)
            return;
        if (!this.gameStarted || this.gameOver) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Сейчас нельзя ставить мины' });
            return;
        }
        if (player.coins < COST_MINE) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Недостаточно зёрен' });
            return;
        }
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Клетка вне поля' });
            return;
        }
        const k = xy(x, y);
        if (player.mines.has(k)) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Здесь уже стоит мина' });
            return;
        }
        if (player.board.shots.has(k)) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Соперник сюда уже стрелял' });
            return;
        }
        if (player.board.ships.some((s) => shipCells(s).some((c) => c.x === x && c.y === y))) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Здесь сидит ваш цыплёнок' });
            return;
        }
        player.coins -= COST_MINE;
        player.mines.set(k, true);
        io.to(player.socketId).emit('bs:mine_placed', { x, y, coins: player.coins });
    }
    handleRadar(userId, x, y, io) {
        const player = this.players.find((p) => p.userId === userId);
        if (!player)
            return;
        if (!this.gameStarted || this.gameOver) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Сейчас нельзя использовать радар' });
            return;
        }
        if (this.turn !== userId) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Радар — только в свой ход' });
            return;
        }
        if (player.coins < COST_RADAR) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Недостаточно зёрен' });
            return;
        }
        const opp = this.opp(userId);
        if (!opp?.board)
            return;
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Клетка вне поля' });
            return;
        }
        player.coins -= COST_RADAR;
        let ships = 0, mines = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE)
                    continue;
                if (opp.board.ships.some((s) => shipCells(s).some((c) => c.x === nx && c.y === ny)))
                    ships++;
                if (opp.mines.has(xy(nx, ny)))
                    mines++;
            }
        }
        io.to(player.socketId).emit('bs:radar_result', { x, y, ships, mines, coins: player.coins });
    }
    handleAirstrike(userId, orientation, index, io) {
        const player = this.players.find((p) => p.userId === userId);
        if (!player)
            return;
        if (!this.gameStarted || this.gameOver) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Сейчас нельзя бомбить' });
            return;
        }
        if (this.turn !== userId) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Авиаудар — только в свой ход' });
            return;
        }
        if (player.coins < COST_AIRSTRIKE) {
            io.to(player.socketId).emit('bs:ability_error', { reason: 'Недостаточно зёрен' });
            return;
        }
        if (index < 0 || index >= BOARD_SIZE)
            return;
        const opp = this.opp(userId);
        if (!opp?.board)
            return;
        player.coins -= COST_AIRSTRIKE;
        const cells = [];
        let mineTriggered = false, anyHit = false, allSunk = false;
        for (let i = 0; i < BOARD_SIZE; i++) {
            const cx = orientation === 'h' ? i : index;
            const cy = orientation === 'v' ? i : index;
            const k = xy(cx, cy);
            if (opp.board.shots.has(k))
                continue;
            const outcome = shoot(opp.board, cx, cy);
            if (outcome.alreadyShot)
                continue;
            cells.push({ x: cx, y: cy, result: outcome.result, killedShip: outcome.killedShipCells, surroundingMisses: outcome.surroundingMisses });
            player.coins += outcome.result === 'miss' ? COIN_REWARD_MISS : COIN_REWARD_HIT;
            if (outcome.result !== 'miss')
                anyHit = true;
            if (opp.mines.has(k)) {
                opp.mines.delete(k);
                mineTriggered = true;
            }
            if (outcome.allSunk)
                allSunk = true;
        }
        const base = { orientation, index, cells, mineTriggered: mineTriggered || undefined };
        io.to(player.socketId).emit('bs:airstrike_result', { ...base, byYou: true, coins: player.coins });
        io.to(opp.socketId).emit('bs:airstrike_result', { ...base, byYou: false });
        if (allSunk) {
            this.endGame(userId, io);
            return;
        }
        if (mineTriggered) {
            this.turn = opp.userId;
            this.bonusTurns.set(opp.userId, (this.bonusTurns.get(opp.userId) ?? 0) + 1);
        }
        else if (!anyHit) {
            this.passTurn(userId);
        }
        this.broadcastTurn(io);
    }
    handleRematch(userId, io) {
        if (!this.gameOver)
            return;
        const player = this.players.find((p) => p.userId === userId);
        if (!player)
            return;
        player.rematch = true;
        const opp = this.opp(userId);
        if (opp)
            io.to(opp.socketId).emit('bs:rematch_requested');
        if (opp?.rematch) {
            this.resetGame();
            this.notifyBothOpponentJoined(io);
        }
    }
    endGame(winnerUserId, io) {
        this.gameOver = true;
        const winner = this.players.find((p) => p.userId === winnerUserId);
        const loser = this.opp(winnerUserId);
        io.to(winner.socketId).emit('bs:game_over', {
            youWon: true,
            opponentShips: loser.board.ships,
            opponentMines: this.minesAsCells(loser),
        });
        io.to(loser.socketId).emit('bs:game_over', {
            youWon: false,
            opponentShips: winner.board.ships,
            opponentMines: this.minesAsCells(winner),
        });
    }
    minesAsCells(p) {
        return [...p.mines.keys()].map((k) => {
            const [x, y] = k.split(',').map(Number);
            return { x, y };
        });
    }
    passTurn(currentUserId) {
        const bonus = this.bonusTurns.get(currentUserId) ?? 0;
        if (bonus > 0) {
            this.bonusTurns.set(currentUserId, bonus - 1);
            return;
        }
        const opp = this.players.find((p) => p.userId !== currentUserId);
        if (opp)
            this.turn = opp.userId;
    }
    broadcastTurn(io) {
        for (const p of this.players) {
            io.to(p.socketId).emit('bs:turn', { yourTurn: p.userId === this.turn });
        }
    }
    opp(userId) {
        return this.players.find((p) => p.userId !== userId);
    }
}
// ── In-memory state ─────────────────────────────────────────
const rooms = new Map();
const codeIndex = new Map(); // code → roomId
const userRoom = new Map(); // userId → roomId
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
    for (let attempt = 0; attempt < 32; attempt++) {
        let code = '';
        for (let i = 0; i < 5; i++)
            code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
        if (!codeIndex.has(code))
            return code;
    }
    throw new Error('Failed to allocate room code');
}
function makeRoomId() {
    return 'bs' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function cleanupRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room)
        return;
    if (room.isEmpty()) {
        codeIndex.delete(room.code);
        rooms.delete(roomId);
    }
}
// ── Handler registration ────────────────────────────────────
export function registerBsHandlers(io, socket) {
    const userId = socket.user.id;
    socket.on('bs:create_room', (callback) => {
        if (typeof callback !== 'function')
            return;
        if (userRoom.has(userId)) {
            callback({ ok: false, error: 'already_in_room' });
            return;
        }
        const roomId = makeRoomId();
        const code = generateCode();
        const room = new BsRoom(roomId, code);
        room.addPlayer(userId, socket.id);
        rooms.set(roomId, room);
        codeIndex.set(code, roomId);
        userRoom.set(userId, roomId);
        callback({ ok: true, code });
    });
    socket.on('bs:join_room', (payload, callback) => {
        if (typeof callback !== 'function')
            return;
        if (userRoom.has(userId)) {
            callback({ ok: false, error: 'already_in_room' });
            return;
        }
        const code = String(payload?.code ?? '').toUpperCase().trim();
        const roomId = codeIndex.get(code);
        if (!roomId) {
            callback({ ok: false, error: 'room_not_found' });
            return;
        }
        const room = rooms.get(roomId);
        if (!room) {
            callback({ ok: false, error: 'room_not_found' });
            return;
        }
        if (room.isFull()) {
            callback({ ok: false, error: 'room_full' });
            return;
        }
        room.addPlayer(userId, socket.id);
        userRoom.set(userId, roomId);
        callback({ ok: true });
        room.notifyBothOpponentJoined(io);
    });
    socket.on('bs:ready', (payload) => {
        const roomId = userRoom.get(userId);
        const room = roomId ? rooms.get(roomId) : null;
        if (!room || !Array.isArray(payload?.ships))
            return;
        room.handleReady(userId, payload.ships, io);
    });
    socket.on('bs:shoot', (payload) => {
        const room = rooms.get(userRoom.get(userId) ?? '');
        if (!room)
            return;
        room.handleShoot(userId, payload.x, payload.y, io);
    });
    socket.on('bs:place_mine', (payload) => {
        const room = rooms.get(userRoom.get(userId) ?? '');
        if (!room)
            return;
        room.handlePlaceMine(userId, payload.x, payload.y, io);
    });
    socket.on('bs:use_radar', (payload) => {
        const room = rooms.get(userRoom.get(userId) ?? '');
        if (!room)
            return;
        room.handleRadar(userId, payload.x, payload.y, io);
    });
    socket.on('bs:use_airstrike', (payload) => {
        const room = rooms.get(userRoom.get(userId) ?? '');
        if (!room)
            return;
        room.handleAirstrike(userId, payload.orientation, payload.index, io);
    });
    socket.on('bs:rematch', () => {
        const room = rooms.get(userRoom.get(userId) ?? '');
        if (!room)
            return;
        room.handleRematch(userId, io);
    });
    socket.on('bs:leave', () => {
        const roomId = userRoom.get(userId);
        if (!roomId)
            return;
        const room = rooms.get(roomId);
        if (room)
            room.removePlayer(userId, io);
        userRoom.delete(userId);
        cleanupRoom(roomId);
    });
    socket.on('disconnect', () => {
        const roomId = userRoom.get(userId);
        if (!roomId)
            return;
        const room = rooms.get(roomId);
        if (room)
            room.removePlayer(userId, io);
        userRoom.delete(userId);
        cleanupRoom(roomId);
    });
}
