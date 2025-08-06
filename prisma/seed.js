import 'dotenv/config';
import { prisma } from '../app/lib/prisma.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample user preferences
  const userPrefs = await prisma.userPreferences.upsert({
    where: { shop: 'majorsuniverse.myshopify.com' },
    update: {},
    create: {
      shop: 'majorsuniverse.myshopify.com',
      defaultBatchSize: 10,
      emailNotifications: true,
      savedFilters: {
        "common_filters": [
          {
            "name": "Summer Products",
            "filters": {
              "hasTagFilter": "summer",
              "productTypeFilter": "Apparel"
            }
          },
          {
            "name": "Sale Items",
            "filters": {
              "hasTagFilter": "sale",
              "priceRange": [0, 50]
            }
          }
        ]
      }
    }
  });

  // Create sample tag usage data
  const tagUsageData = [
    { tagName: 'summer', usageCount: 45 },
    { tagName: 'sale', usageCount: 32 },
    { tagName: 'new-arrival', usageCount: 28 },
    { tagName: 'bestseller', usageCount: 15 },
    { tagName: 'clearance', usageCount: 12 },
    { tagName: 'limited-edition', usageCount: 8 },
    { tagName: 'organic', usageCount: 22 },
    { tagName: 'eco-friendly', usageCount: 18 }
  ];

  for (const tag of tagUsageData) {
    await prisma.tagUsage.upsert({
      where: { 
        shop_tagName: {
          shop: 'majorsuniverse.myshopify.com',
          tagName: tag.tagName
        }
      },
      update: {
        usageCount: tag.usageCount,
        lastUsed: new Date()
      },
      create: {
        shop: 'majorsuniverse.myshopify.com',
        tagName: tag.tagName,
        usageCount: tag.usageCount,
        lastUsed: new Date()
      }
    });
  }

  // Create sample bulk tag jobs (historical data)
  const sampleJobs = [
    {
      shop: 'majorsuniverse.myshopify.com',
      status: 'COMPLETED',
      operation: 'ADD_TAG',
      totalCount: 25,
      processedCount: 25,
      successCount: 25,
      failedCount: 0,
      tagValue: 'summer-2025',
      productIds: Array.from({length: 25}, (_, i) => `gid://shopify/Product/${7000000000000 + i}`),
      completedAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      shop: 'majorsuniverse.myshopify.com',
      status: 'COMPLETED',
      operation: 'REMOVE_TAG',
      totalCount: 15,
      processedCount: 15,
      successCount: 12,
      failedCount: 3,
      tagValue: 'winter-2024',
      productIds: Array.from({length: 15}, (_, i) => `gid://shopify/Product/${7000000000100 + i}`),
      errorLog: 'Failed to update 3 products: insufficient permissions',
      completedAt: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      shop: 'majorsuniverse.myshopify.com',
      status: 'COMPLETED',
      operation: 'REPLACE_TAG',
      totalCount: 8,
      processedCount: 8,
      successCount: 8,
      failedCount: 0,
      tagValue: 'on-sale',
      oldTagValue: 'full-price',
      productIds: Array.from({length: 8}, (_, i) => `gid://shopify/Product/${7000000000200 + i}`),
      completedAt: new Date(Date.now() - 259200000) // 3 days ago
    }
  ];

  for (const job of sampleJobs) {
    await prisma.bulkTagJob.create({
      data: {
        ...job,
        createdAt: job.completedAt ? new Date(job.completedAt.getTime() - 300000) : new Date(), // 5 min before completion
        updatedAt: job.completedAt || new Date()
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created user preferences for: ${userPrefs.shop}`);
  console.log(`🏷️  Created ${tagUsageData.length} tag usage records`);
  console.log(`💼 Created ${sampleJobs.length} sample bulk tag jobs`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
