import 'dotenv/config';
import { prisma } from '../app/lib/prisma.js';

async function runQueries() {
  console.log('🔍 Running sample queries for Bulk Product Tag Editor...\n');

  try {
    // 1. Get user preferences
    console.log('1️⃣ User Preferences:');
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { shop: 'majorsuniverse.myshopify.com' }
    });
    console.log(userPrefs);
    console.log();

    // 2. Get most used tags
    console.log('2️⃣ Most Popular Tags:');
    const popularTags = await prisma.tagUsage.findMany({
      where: { shop: 'majorsuniverse.myshopify.com' },
      orderBy: { usageCount: 'desc' },
      take: 5
    });
    popularTags.forEach((tag, index) => {
      console.log(`${index + 1}. ${tag.tagName}: ${tag.usageCount} uses`);
    });
    console.log();

    // 3. Recent bulk tag jobs
    console.log('3️⃣ Recent Bulk Tag Jobs:');
    const recentJobs = await prisma.bulkTagJob.findMany({
      where: { shop: 'majorsuniverse.myshopify.com' },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    recentJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.operation}: "${job.tagValue}" (${job.status})`);
      console.log(`   Products: ${job.successCount}/${job.totalCount} successful`);
      console.log(`   Date: ${job.createdAt.toLocaleDateString()}`);
      console.log();
    });

    // 4. Job success rate statistics
    console.log('4️⃣ Job Success Statistics:');
    const jobStats = await prisma.bulkTagJob.aggregate({
      where: { 
        shop: 'majorsuniverse.myshopify.com',
        status: 'COMPLETED'
      },
      _sum: {
        totalCount: true,
        successCount: true,
        failedCount: true
      },
      _count: {
        id: true
      }
    });
    
    if (jobStats._sum.totalCount > 0) {
      const successRate = (jobStats._sum.successCount / jobStats._sum.totalCount * 100).toFixed(1);
      console.log(`Total Jobs: ${jobStats._count.id}`);
      console.log(`Products Processed: ${jobStats._sum.totalCount}`);
      console.log(`Success Rate: ${successRate}%`);
      console.log(`Failed Operations: ${jobStats._sum.failedCount}`);
    }
    console.log();

    // 5. Create a sample new job
    console.log('5️⃣ Creating Sample Job:');
    const newJob = await prisma.bulkTagJob.create({
      data: {
        shop: 'majorsuniverse.myshopify.com',
        status: 'PENDING',
        operation: 'ADD_TAG',
        totalCount: 5,
        tagValue: 'sample-tag',
        productIds: [
          'gid://shopify/Product/7000000001000',
          'gid://shopify/Product/7000000001001',
          'gid://shopify/Product/7000000001002',
          'gid://shopify/Product/7000000001003',
          'gid://shopify/Product/7000000001004'
        ]
      }
    });
    console.log(`Created job: ${newJob.id} (${newJob.operation}: "${newJob.tagValue}")`);
    console.log();

    // 6. Update the job to completed
    console.log('6️⃣ Updating Job Status:');
    const updatedJob = await prisma.bulkTagJob.update({
      where: { id: newJob.id },
      data: {
        status: 'COMPLETED',
        processedCount: 5,
        successCount: 5,
        failedCount: 0,
        completedAt: new Date()
      }
    });
    console.log(`Updated job ${updatedJob.id} to COMPLETED`);
    console.log();

    // 7. Update tag usage
    console.log('7️⃣ Updating Tag Usage:');
    const tagUsage = await prisma.tagUsage.upsert({
      where: {
        shop_tagName: {
          shop: 'majorsuniverse.myshopify.com',
          tagName: 'sample-tag'
        }
      },
      update: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      },
      create: {
        shop: 'majorsuniverse.myshopify.com',
        tagName: 'sample-tag',
        usageCount: 1,
        lastUsed: new Date()
      }
    });
    console.log(`Tag usage for "${tagUsage.tagName}": ${tagUsage.usageCount} uses`);

    console.log('\n✅ All queries completed successfully!');

  } catch (error) {
    console.error('❌ Error running queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runQueries();
