# Copilot Instructions for Bulk Product Tag Editor

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a "One-Click" Bulk Product Tag Editor - a micro-SaaS Shopify app that solves the tedious problem of managing product tags at scale. Store owners can filter products using smart criteria and perform bulk tag operations with a single click, saving hours of manual work.

## The "One-Click" Solution
**Problem**: Shopify merchants waste hours manually adding/removing tags from hundreds or thousands of products
**Solution**: Smart filtering + bulk actions = one-click tag management

## User Flow & Features
### 1. Smart Filtering System
- **Product Title Contains**: Text search within product titles
- **Product Type Is**: Filter by specific product types (dropdown)
- **Vendor Is**: Filter by vendor/brand (dropdown)
- **Price Range**: Filter products between min/max price values
- **Has Tag**: Show products that already have specific tags
- **Does Not Have Tag**: Show products missing specific tags
- **Combine Filters**: Use multiple criteria for precise targeting

### 2. One-Click Actions
- **Add Tag**: Apply new tags to all filtered products
- **Remove Tag**: Remove specific tags from filtered products  
- **Replace Tag**: Replace old tags with new ones across filtered products
- **Preview Mode**: Show "X products will be affected" before execution
- **Background Processing**: Handle large batches without blocking UI
- **Progress Tracking**: Real-time status updates and completion notifications

### 3. Dashboard Experience
- Clean, intuitive interface showing entire product catalog
- Filter results display with product count
- Big, clear action buttons for tag operations
- Confirmation dialogs with impact preview
- Job status monitoring with progress bars

## Tech Stack
- **Framework**: Remix (React-based full-stack framework)
- **Backend**: Node.js with Shopify Admin API
- **Database**: Prisma with SQLite (stores job queue, user preferences)
- **Styling**: Shopify Polaris design system
- **Build Tool**: Vite
- **Authentication**: Shopify OAuth
- **Queue System**: Background job processing for bulk operations

## Critical Implementation Details
### GraphQL Queries
- Fetch products with pagination for large catalogs
- Include fields: id, title, productType, vendor, tags, priceRangeV2
- Use cursor-based pagination for performance
- Implement efficient filtering on the backend

### Bulk Operations
- Use Shopify's bulk operations API for large datasets
- Implement rate limiting to respect API limits
- Queue system for processing jobs in background
- Error handling and retry logic for failed operations

### UI/UX Priorities
- Filter interface should be prominent and easy to use
- Product preview table showing affected items
- Clear action buttons with confirmation dialogs
- Progress indicators for long-running operations
- Success/error notifications with detailed feedback

## Code Style Guidelines
- Use TypeScript for type safety
- Follow Shopify Polaris design patterns
- Use Remix's data loading patterns (loaders and actions)
- Implement proper error handling and loading states
- Use GraphQL for all Shopify API interactions
- Create reusable components for filters and actions

## Important Files
- `app/routes/app._index.tsx`: Main dashboard with filters and actions
- `app/routes/app.bulk-edit.tsx`: Bulk edit interface
- `app/components/ProductFilter.tsx`: Smart filtering component
- `app/components/TagActions.tsx`: Tag operation components
- `app/services/bulk-operations.ts`: Background job processing
- `app/shopify.server.ts`: Shopify API configuration
- `prisma/schema.prisma`: Database schema for jobs and preferences

## Business Logic Requirements
- Always validate filters before showing results
- Prevent accidental operations on entire catalog
- Implement undo functionality where possible
- Log all bulk operations for audit trail
- Show clear pricing/usage information if implementing limits
- Handle edge cases (products without tags, duplicate tags, etc.)

## Development Notes
- Test with large product catalogs (1000+ products)
- Implement proper pagination and lazy loading
- Use Shopify's bulk operations for efficiency
- Add comprehensive error handling
- Include analytics tracking for feature usage
- Consider rate limiting for heavy users
