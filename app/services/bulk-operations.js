// Bulk operations service for handling large tag updates
export class BulkOperationsService {
  constructor(admin) {
    this.admin = admin;
    this.BATCH_SIZE = 10; // Process 10 products at a time to respect rate limits
    this.DELAY_MS = 100; // Small delay between batches
  }

  async addTagsToProducts(productIds, tagToAdd) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process in batches
    for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
      const batch = productIds.slice(i, i + this.BATCH_SIZE);
      
      for (const productId of batch) {
        try {
          // First, get current tags
          const currentProduct = await this.getProductTags(productId);
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
      
      // Small delay between batches to respect rate limits
      if (i + this.BATCH_SIZE < productIds.length) {
        await this.delay(this.DELAY_MS);
      }
    }

    return results;
  }

  async removeTagsFromProducts(productIds, tagToRemove) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
      const batch = productIds.slice(i, i + this.BATCH_SIZE);
      
      for (const productId of batch) {
        try {
          const currentProduct = await this.getProductTags(productId);
          if (!currentProduct) {
            results.failed++;
            results.errors.push(`Product ${productId} not found`);
            continue;
          }

          const currentTags = currentProduct.tags || [];
          const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
          
          // Only update if tag was actually removed
          if (updatedTags.length !== currentTags.length) {
            await this.updateProductTags(productId, updatedTags);
          }
          
          results.success++;
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to update ${productId}: ${error.message}`);
        }
      }
      
      if (i + this.BATCH_SIZE < productIds.length) {
        await this.delay(this.DELAY_MS);
      }
    }

    return results;
  }

  async replaceTagsInProducts(productIds, oldTag, newTag) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
      const batch = productIds.slice(i, i + this.BATCH_SIZE);
      
      for (const productId of batch) {
        try {
          const currentProduct = await this.getProductTags(productId);
          if (!currentProduct) {
            results.failed++;
            results.errors.push(`Product ${productId} not found`);
            continue;
          }

          const currentTags = currentProduct.tags || [];
          const updatedTags = currentTags.map(tag => 
            tag === oldTag ? newTag : tag
          );
          
          // Only update if there was actually a replacement
          if (updatedTags.some(tag => tag === newTag) && 
              currentTags.some(tag => tag === oldTag)) {
            await this.updateProductTags(productId, updatedTags);
          }
          
          results.success++;
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to update ${productId}: ${error.message}`);
        }
      }
      
      if (i + this.BATCH_SIZE < productIds.length) {
        await this.delay(this.DELAY_MS);
      }
    }

    return results;
  }

  async getProductTags(productId) {
    const response = await this.admin.graphql(`
      #graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          tags
        }
      }
    `, {
      variables: { id: productId }
    });

    const data = await response.json();
    return data.data?.product;
  }

  async updateProductTags(productId, tags) {
    const response = await this.admin.graphql(`
      #graphql
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
}
