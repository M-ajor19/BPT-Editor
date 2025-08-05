// Bulk operations service for handling large tag updates with PostgreSQL integration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BulkOperationsService {
  constructor(admin, shop = null) {
    this.admin = admin;
    this.shop = shop;
    this.BATCH_SIZE = 10; // Process 10 products at a time to respect rate limits
    this.DELAY_MS = 100; // Small delay between batches
  }

  async addTagsToProducts(productIds, tagToAdd) {
    // Create job record
    const job = await this.createBulkJob('ADD_TAG', productIds, tagToAdd);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      jobId: job.id
    };

    try {
      await this.updateJobStatus(job.id, 'IN_PROGRESS');

      // Process in batches
      for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
        const batch = productIds.slice(i, i + this.BATCH_SIZE);
        
        for (const productId of batch) {
          try {
            // Get current product data
            const currentProduct = await this.getProductById(productId);
            if (!currentProduct) {
              results.failed++;
              results.errors.push(`Product ${productId} not found`);
              continue;
            }

            const currentTags = currentProduct.tags || [];
            
            // Don't add if tag already exists
            if (currentTags.includes(tagToAdd)) {
              results.success++;
              continue;
            }

            // Add new tag to existing tags
            const updatedTags = [...currentTags, tagToAdd];
            
            await this.updateProductTags(productId, updatedTags);
            results.success++;
            
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to update ${productId}: ${error.message}`);
          }
        }
        
        // Update progress
        await this.updateJobProgress(job.id, results.success + results.failed, results.success, results.failed);
        
        // Small delay between batches to respect rate limits
        if (i + this.BATCH_SIZE < productIds.length) {
          await this.delay(this.DELAY_MS);
        }
      }

      // Complete the job
      await this.completeJob(job.id, results);
      
      // Update tag usage statistics
      if (results.success > 0) {
        await this.updateTagUsage(tagToAdd);
      }

    } catch (error) {
      await this.failJob(job.id, error.message);
      throw error;
    }

    return results;
  }

  async removeTagsFromProducts(productIds, tagToRemove) {
    // Create job record
    const job = await this.createBulkJob('REMOVE_TAG', productIds, tagToRemove);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      jobId: job.id
    };

    try {
      await this.updateJobStatus(job.id, 'IN_PROGRESS');

      // Process in batches
      for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
        const batch = productIds.slice(i, i + this.BATCH_SIZE);
        
        for (const productId of batch) {
          try {
            // Get current product data
            const currentProduct = await this.getProductById(productId);
            if (!currentProduct) {
              results.failed++;
              results.errors.push(`Product ${productId} not found`);
              continue;
            }

            const currentTags = currentProduct.tags || [];
            
            // Don't remove if tag doesn't exist
            if (!currentTags.includes(tagToRemove)) {
              results.success++;
              continue;
            }

            // Remove tag from existing tags
            const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
            
            await this.updateProductTags(productId, updatedTags);
            results.success++;
            
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to update ${productId}: ${error.message}`);
          }
        }
        
        // Update progress
        await this.updateJobProgress(job.id, results.success + results.failed, results.success, results.failed);
        
        // Small delay between batches to respect rate limits
        if (i + this.BATCH_SIZE < productIds.length) {
          await this.delay(this.DELAY_MS);
        }
      }

      // Complete the job
      await this.completeJob(job.id, results);

    } catch (error) {
      await this.failJob(job.id, error.message);
      throw error;
    }

    return results;
  }

  async replaceTagsInProducts(productIds, oldTag, newTag) {
    // Create job record
    const job = await this.createBulkJob('REPLACE_TAG', productIds, newTag, oldTag);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      jobId: job.id
    };

    try {
      await this.updateJobStatus(job.id, 'IN_PROGRESS');

      // Process in batches
      for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
        const batch = productIds.slice(i, i + this.BATCH_SIZE);
        
        for (const productId of batch) {
          try {
            // Get current product data
            const currentProduct = await this.getProductById(productId);
            if (!currentProduct) {
              results.failed++;
              results.errors.push(`Product ${productId} not found`);
              continue;
            }

            const currentTags = currentProduct.tags || [];
            
            // Don't replace if old tag doesn't exist
            if (!currentTags.includes(oldTag)) {
              results.success++;
              continue;
            }

            // Replace old tag with new tag
            const updatedTags = currentTags.map(tag => tag === oldTag ? newTag : tag);
            
            await this.updateProductTags(productId, updatedTags);
            results.success++;
            
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to update ${productId}: ${error.message}`);
          }
        }
        
        // Update progress
        await this.updateJobProgress(job.id, results.success + results.failed, results.success, results.failed);
        
        // Small delay between batches to respect rate limits
        if (i + this.BATCH_SIZE < productIds.length) {
          await this.delay(this.DELAY_MS);
        }
      }

      // Complete the job
      await this.completeJob(job.id, results);
      
      // Update tag usage statistics
      if (results.success > 0) {
        await this.updateTagUsage(newTag);
      }

    } catch (error) {
      await this.failJob(job.id, error.message);
      throw error;
    }

    return results;
  }

  // Helper method to get product by ID
  async getProductById(productId) {
    const response = await this.admin.graphql(`
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          tags
        }
      }
    `, {
      variables: { id: productId }
    });

    const data = await response.json();
    return data.data?.product;
  }

  // Helper method to update product tags
  async updateProductTags(productId, tags) {
    const response = await this.admin.graphql(`
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        input: {
          id: productId,
          tags: tags
        }
      }
    });

    const data = await response.json();
    
    if (data.data?.productUpdate?.userErrors?.length > 0) {
      throw new Error(data.data.productUpdate.userErrors[0].message);
    }

    return data.data?.productUpdate?.product;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Database helper methods
  async createBulkJob(operation, productIds, tagValue, oldTagValue = null) {
    return await prisma.bulkTagJob.create({
      data: {
        shop: this.shop || 'default',
        status: 'PENDING',
        operation: operation,
        totalCount: productIds.length,
        tagValue: tagValue,
        oldTagValue: oldTagValue,
        productIds: productIds
      }
    });
  }

  async updateJobStatus(jobId, status) {
    return await prisma.bulkTagJob.update({
      where: { id: jobId },
      data: { status: status }
    });
  }

  async updateJobProgress(jobId, processedCount, successCount, failedCount) {
    return await prisma.bulkTagJob.update({
      where: { id: jobId },
      data: {
        processedCount: processedCount,
        successCount: successCount,
        failedCount: failedCount
      }
    });
  }

  async completeJob(jobId, results) {
    return await prisma.bulkTagJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        processedCount: results.success + results.failed,
        successCount: results.success,
        failedCount: results.failed,
        errorLog: results.errors.length > 0 ? results.errors.join('\n') : null,
        completedAt: new Date()
      }
    });
  }

  async failJob(jobId, errorMessage) {
    return await prisma.bulkTagJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorLog: errorMessage,
        completedAt: new Date()
      }
    });
  }

  async updateTagUsage(tagName) {
    if (!this.shop) return;
    
    return await prisma.tagUsage.upsert({
      where: {
        shop_tagName: {
          shop: this.shop,
          tagName: tagName
        }
      },
      update: {
        usageCount: { increment: 1 },
        lastUsed: new Date()
      },
      create: {
        shop: this.shop,
        tagName: tagName,
        usageCount: 1,
        lastUsed: new Date()
      }
    });
  }
}
