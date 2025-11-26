import  prisma  from '@/lib/prisma'

async function main() {
const category = await prisma.job_categories.create({
    data: {
        category: 'Marketing jobs',
        last_fetched_at: new Date(),
        location:'Ghana'
    }
})
  console.log('Created category:', category)
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