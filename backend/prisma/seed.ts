import { prisma } from '../src/lib/prisma.js'

const GAMES = [
    {
        slug: 'tictactoe',
        title: 'Крестики-нолики',
        description: 'Вечная классика на сетке 3×3. Поймай противника на двойной угрозе.',
        maxPlayers: 2,
    },
    {
        slug: 'snake',
        title: 'Змейка',
        description: 'Ешь, расти, не врежься. Чем длиннее — тем теснее становится поле.',
        maxPlayers: 1,
    },
    {
        slug: 'minesweeper',
        title: 'Сапёр',
        description: 'Логика, флажки и редкие, но впечатляющие неудачи.',
        maxPlayers: 1,
    },
    {
        slug: 'pong',
        title: 'Понг',
        description: 'Две ракетки, один мяч, ноль причин не играть.',
        maxPlayers: 2,
    },
    {
        slug: 'memory',
        title: 'Мемори',
        description: 'Открывай парные карточки. Кто запомнил больше — тот и прав.',
        maxPlayers: 4,
    },
    {
        slug: '2048',
        title: '2048',
        description: 'Складывай числа, удваивай, не загоняй себя в угол.',
        maxPlayers: 1,
    },
    {
        slug: 'reversi',
        title: 'Реверси',
        description: 'Переворачивай чужие фишки. Углы — на вес золота.',
        maxPlayers: 2,
    },
    {
        slug: 'tetris',
        title: 'Тетрис',
        description: 'Падают фигуры — складывай ровными строками. До скорости света.',
        maxPlayers: 1,
    },
] as const

async function main() {
    for (const g of GAMES) {
        await prisma.game.upsert({
            where: { slug: g.slug },
            create: g,
            update: {
                title: g.title,
                description: g.description,
                maxPlayers: g.maxPlayers,
            },
        })
    }
    console.log(`Seeded ${GAMES.length} games`)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
        console.error(err)
        await prisma.$disconnect()
        process.exit(1)
    })
