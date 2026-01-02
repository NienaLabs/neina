import prisma from '@/lib/prisma'

const interests = [
    "Software Engineering",
    "Data Science",
    "Marketing and Sales",
    "Human Resource Management",
    "Finance",
    "Project or Product Management",
    "AI/ML",
    "Cybersecurity",
];

async function main() {
    console.log(`Start seeding ${interests.length} categories...`)

    for (const interest of interests) {
        try {
            const category = await prisma.job_categories.create({
                data: {
                    category: `${interest} jobs`,
                    last_fetched_at: new Date(),
                    location: 'Ghana', // Default location as per previous script
                    active: true
                }
            })
            console.log(`Created category: ${category.category}`)
        } catch (error) {
           console.error(`Error creating category ${interest}:`, error) 
        }
    }
    
    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })