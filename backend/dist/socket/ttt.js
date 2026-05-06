const matches = new Map();
const codeIndex = new Map(); // code → matchId
const randomQueue = [];
const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];
function findWinner(board) {
    for (const line of LINES) {
        const [a, b, c] = line;
        const v = board[a];
        if (v && v === board[b] && v === board[c]) {
            return { winner: v, line: [a, b, c] };
        }
    }
    return null;
}
// Avoid visually confusing chars (0/O, 1/I/L). 32^5 ≈ 33M combinations.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
    let code = '';
    for (let attempt = 0; attempt < 16; attempt++) {
        code = '';
        for (let i = 0; i < 5; i++) {
            code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
        }
        if (!codeIndex.has(code))
            return code;
    }
    throw new Error('Failed to allocate room code');
}
function makeMatchId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function room(matchId) {
    return `ttt:${matchId}`;
}
function publicState(match) {
    const trim = (p) => p ? { userId: p.userId, username: p.username } : null;
    return {
        matchId: match.id,
        code: match.code,
        board: match.board,
        turn: match.turn,
        status: match.status,
        winner: match.winner,
        winningLine: match.winningLine,
        players: { X: trim(match.players.X), O: trim(match.players.O) },
    };
}
function createMatch(code) {
    const m = {
        id: makeMatchId(),
        code,
        board: Array(9).fill(null),
        turn: 'X',
        status: 'waiting',
        winner: null,
        winningLine: null,
        players: { X: null, O: null },
        createdAt: Date.now(),
    };
    matches.set(m.id, m);
    if (code)
        codeIndex.set(code, m.id);
    return m;
}
function deleteMatch(match) {
    if (match.code)
        codeIndex.delete(match.code);
    matches.delete(match.id);
}
function userRole(match, userId) {
    if (match.players.X?.userId === userId)
        return 'X';
    if (match.players.O?.userId === userId)
        return 'O';
    return null;
}
async function attachPlayer(match, socket, role) {
    if (!socket.user)
        return false;
    const userId = socket.user.id;
    const username = socket.user.username || socket.user.name;
    // Already a player on this match? Just track the new socket.
    const existingRole = userRole(match, userId);
    if (existingRole) {
        match.players[existingRole].socketIds.add(socket.id);
        await socket.join(room(match.id));
        return true;
    }
    if (match.players[role])
        return false;
    match.players[role] = { userId, username, socketIds: new Set([socket.id]) };
    await socket.join(room(match.id));
    return true;
}
function maybeStart(match) {
    if (match.status === 'waiting' && match.players.X && match.players.O) {
        match.status = 'active';
    }
}
function removeFromQueue(socketId) {
    const idx = randomQueue.findIndex((q) => q.socketId === socketId);
    if (idx >= 0)
        randomQueue.splice(idx, 1);
}
function endByForfeit(io, match, leavingUserId) {
    const role = userRole(match, leavingUserId);
    if (!role)
        return;
    if (match.status === 'waiting') {
        // Nothing to forfeit yet — just cancel the empty room.
        io.to(room(match.id)).emit('ttt:cancelled', { matchId: match.id });
        deleteMatch(match);
        return;
    }
    if (match.status !== 'active')
        return;
    match.status = 'finished';
    match.winner = role === 'X' ? 'O' : 'X';
    match.winningLine = null;
    io.to(room(match.id)).emit('ttt:state', publicState(match));
}
export function registerTttHandlers(io, socket) {
    if (!socket.user)
        return;
    socket.on('ttt:create_room', async (cb) => {
        const code = generateCode();
        const match = createMatch(code);
        const ok = await attachPlayer(match, socket, 'X');
        if (!ok) {
            deleteMatch(match);
            return cb?.({ ok: false, error: 'attach_failed' });
        }
        cb?.({ ok: true, state: publicState(match) });
    });
    socket.on('ttt:join_room', async (payload, cb) => {
        const raw = payload?.code?.trim().toUpperCase() ?? '';
        if (!/^[A-Z0-9]{5}$/.test(raw)) {
            return cb?.({ ok: false, error: 'invalid_code' });
        }
        const matchId = codeIndex.get(raw);
        const match = matchId ? matches.get(matchId) : null;
        if (!match)
            return cb?.({ ok: false, error: 'room_not_found' });
        if (match.status !== 'waiting') {
            // Allow rejoin if already a player (e.g. second tab).
            if (userRole(match, socket.user.id)) {
                await socket.join(room(match.id));
                return cb?.({ ok: true, state: publicState(match) });
            }
            return cb?.({ ok: false, error: 'room_in_progress' });
        }
        const ok = await attachPlayer(match, socket, 'O');
        if (!ok)
            return cb?.({ ok: false, error: 'room_full' });
        maybeStart(match);
        io.to(room(match.id)).emit('ttt:state', publicState(match));
        cb?.({ ok: true, state: publicState(match) });
    });
    socket.on('ttt:random_match', async (cb) => {
        const myUserId = socket.user.id;
        // Drop any stale entry for this socket before pairing.
        removeFromQueue(socket.id);
        // Try to pair with someone who isn't us.
        while (randomQueue.length > 0) {
            const partnerEntry = randomQueue.shift();
            if (partnerEntry.userId === myUserId)
                continue;
            const partnerSocket = io.sockets.sockets.get(partnerEntry.socketId);
            if (!partnerSocket || !partnerSocket.user)
                continue;
            const match = createMatch(null);
            const okX = await attachPlayer(match, partnerSocket, 'X');
            const okO = await attachPlayer(match, socket, 'O');
            if (!okX || !okO) {
                deleteMatch(match);
                return cb?.({ ok: false, error: 'pair_failed' });
            }
            maybeStart(match);
            io.to(room(match.id)).emit('ttt:state', publicState(match));
            return cb?.({ ok: true, state: publicState(match) });
        }
        // Nobody to pair — wait in queue.
        randomQueue.push({ userId: myUserId, socketId: socket.id, queuedAt: Date.now() });
        cb?.({ ok: true, queued: true });
    });
    socket.on('ttt:cancel_queue', () => {
        removeFromQueue(socket.id);
    });
    socket.on('ttt:cancel_room', (payload) => {
        const matchId = payload?.matchId;
        if (!matchId)
            return;
        const match = matches.get(matchId);
        if (!match)
            return;
        if (match.status !== 'waiting')
            return;
        if (!userRole(match, socket.user.id))
            return;
        io.to(room(match.id)).emit('ttt:cancelled', { matchId: match.id });
        deleteMatch(match);
    });
    socket.on('ttt:move', (payload, cb) => {
        const match = payload?.matchId ? matches.get(payload.matchId) : null;
        if (!match)
            return cb?.({ ok: false, error: 'match_not_found' });
        if (match.status !== 'active')
            return cb?.({ ok: false, error: 'not_active' });
        const idx = payload?.index;
        if (typeof idx !== 'number' || idx < 0 || idx > 8 || !Number.isInteger(idx)) {
            return cb?.({ ok: false, error: 'invalid_index' });
        }
        if (match.board[idx] !== null)
            return cb?.({ ok: false, error: 'cell_taken' });
        const myRole = userRole(match, socket.user.id);
        if (!myRole)
            return cb?.({ ok: false, error: 'not_a_player' });
        if (myRole !== match.turn)
            return cb?.({ ok: false, error: 'not_your_turn' });
        match.board[idx] = myRole;
        const result = findWinner(match.board);
        if (result) {
            match.status = 'finished';
            match.winner = result.winner;
            match.winningLine = result.line;
        }
        else if (match.board.every((c) => c !== null)) {
            match.status = 'finished';
            match.winner = null;
            match.winningLine = null;
        }
        else {
            match.turn = match.turn === 'X' ? 'O' : 'X';
        }
        io.to(room(match.id)).emit('ttt:state', publicState(match));
        cb?.({ ok: true });
    });
    socket.on('ttt:leave', (payload) => {
        const match = payload?.matchId ? matches.get(payload.matchId) : null;
        if (!match)
            return;
        endByForfeit(io, match, socket.user.id);
    });
    socket.on('disconnect', () => {
        removeFromQueue(socket.id);
        for (const match of matches.values()) {
            const xIds = match.players.X?.socketIds;
            const oIds = match.players.O?.socketIds;
            const wasX = xIds?.delete(socket.id) ?? false;
            const wasO = oIds?.delete(socket.id) ?? false;
            if (!wasX && !wasO)
                continue;
            // If this user has no more sockets attached to this match, treat as gone.
            const role = wasX ? 'X' : 'O';
            const remaining = match.players[role]?.socketIds.size ?? 0;
            if (remaining === 0) {
                endByForfeit(io, match, socket.user.id);
            }
        }
    });
}
// ── House-keeping ────────────────────────────────────────────
// Reap rooms that have been sitting in `waiting` for too long, e.g. someone
// created a code and never shared it. 30 min is generous.
const ROOM_TTL_MS = 30 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    for (const match of matches.values()) {
        if (match.status === 'waiting' && now - match.createdAt > ROOM_TTL_MS) {
            deleteMatch(match);
        }
    }
}, 5 * 60 * 1000).unref();
