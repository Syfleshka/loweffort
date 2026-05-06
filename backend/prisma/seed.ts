import { prisma } from '../src/lib/prisma.js'

const GAMES = [
    {
        slug: 'tictactoe',
        title: 'Крестики-нолики',
        description: 'Вечная классика на сетке 3×3. Поймай противника на двойной угрозе.',
        maxPlayers: 2,
    },
    {
        slug: 'battleships',
        title: 'Куриный бой',
        description: 'Морской бой с цыплятами: расставляй стаи, кидай корм, пускай авиаудары.',
        maxPlayers: 2,
    },
] as const

async function main() {
    const slugs = GAMES.map((g) => g.slug)

    // Remove games that are no longer in the list.
    const deleted = await prisma.game.deleteMany({
        where: { slug: { notIn: slugs } },
    })
    if (deleted.count) console.log(`Removed ${deleted.count} stale game(s)`)

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
