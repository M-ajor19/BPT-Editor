import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  DataTable,
  Badge,
  Modal,
  Banner,
  EmptyState,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ProductFilter } from "../components/ProductFilter";
import { TagActions } from "../components/TagActions";
import { BulkOperationsService } from "../services/bulk-operations";

// Performance-optimized loading component for LCP improvement
function DashboardSkeleton() {
  return (
    <SkeletonPage primaryAction>
      <Layout>
        <Layout.Section oneThird>
          <Card>
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={3} />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={5} />
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");
  const productIds = JSON.parse(formData.get("productIds") || "[]");
  const tagValue = formData.get("tagValue");
  const oldTag = formData.get("oldTag");
  
  try {
    const bulkService = new BulkOperationsService(admin);
    let results;
    
    switch (actionType) {
      case "addTag":
        results = await bulkService.addTagsToProducts(productIds, tagValue);
        break;
      case "removeTag":
        results = await bulkService.removeTagsFromProducts(productIds, tagValue);
        break;
      case "replaceTag":
        results = await bulkService.replaceTagsInProducts(productIds, oldTag, tagValue);
        break;
      default:
        throw new Error("Invalid action type");
    }
    
    return {
      success: true,
      message: `Successfully updated ${results.success} products${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      results
    };
  } catch (error) {
    console.error("Bulk operation error:", error);
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
};

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Performance optimization: parallel queries for faster loading
  const [productsResponse] = await Promise.all([
    admin.graphql(`
      #graphql
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              productType
              vendor
              tags
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              status
            }
          }
        }
      }
    `, {
      variables: { first: 100 }
    })
  ]);

  const data = await productsResponse.json();
  const products = data.data.products.edges.map(edge => edge.node);
  
  // Optimize filtering arrays with performance in mind
  const productTypes = [...new Set(
    products.map(product => product.productType).filter(Boolean)
  )].sort();
  
  const vendors = [...new Set(
    products.map(product => product.vendor).filter(Boolean)
  )].sort();

  return { 
    products, 
    productTypes, 
    vendors,
    // Add timestamp for cache invalidation
    timestamp: Date.now()
  };
};

export default function OneClickSolutions() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [filters, setFilters] = useState({
    titleFilter: "",
    productTypeFilter: "",
    vendorFilter: "",
    priceRange: [0, 1000],
    hasTagFilter: "",
    doesNotHaveTagFilter: "",
  });
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Memoize filtered products for performance optimization (CLS prevention)
  const filteredProducts = useMemo(() => {
    const products = loaderData?.products || [];
    if (!products.length) return [];
    
    return products.filter(product => {
      if (filters.titleFilter && !product.title.toLowerCase().includes(filters.titleFilter.toLowerCase())) {
        return false;
      }
      if (filters.productTypeFilter && product.productType !== filters.productTypeFilter) {
        return false;
      }
      if (filters.vendorFilter && product.vendor !== filters.vendorFilter) {
        return false;
      }
      if (filters.hasTagFilter && !product.tags.includes(filters.hasTagFilter)) {
        return false;
      }
      if (filters.doesNotHaveTagFilter && product.tags.includes(filters.doesNotHaveTagFilter)) {
        return false;
      }
      return true;
    });
  }, [loaderData?.products, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      titleFilter: "",
      productTypeFilter: "",
      vendorFilter: "",
      priceRange: [0, 1000],
      hasTagFilter: "",
      doesNotHaveTagFilter: "",
    });
  };

  useEffect(() => {
    if (fetcher.data?.success === true) {
      shopify.toast.show(fetcher.data.message);
    }
  }, [fetcher.data, shopify]);

  // Handle loading state after all hooks are called
  if (!loaderData || !loaderData.products) {
    return <DashboardSkeleton />;
  }

  const handleExecuteAction = (actionData) => {
    setPendingAction(actionData);
    setShowConfirmModal(true);
  };

  const tableRows = filteredProducts.slice(0, 50).map(product => [
    product.title,
    product.productType || "—",
    product.vendor || "—",
    `$${parseFloat(product.priceRangeV2.minVariantPrice.amount).toFixed(2)}`,
    product.tags.length > 0 ? (
      <InlineStack gap="100" wrap={false}>
        {product.tags.slice(0, 3).map(tag => (
          <Badge key={tag} size="small">{tag}</Badge>
        ))}
        {product.tags.length > 3 && (
          <Badge size="small" tone="info">+{product.tags.length - 3} more</Badge>
        )}
      </InlineStack>
    ) : (
      <Text tone="subdued">No tags</Text>
    )
  ]);

  return (
    <>
      {/* Handle loading state for better Core Web Vitals */}
      {!loaderData || !loaderData.products ? (
        <DashboardSkeleton />
      ) : (
        <Page>
          <TitleBar title="One Click Solutions - Bulk Tag Editor" />
          
          <BlockStack gap="500">
            {fetcher.data?.success === false && (
              <Banner status="critical">
                <p>{fetcher.data.message}</p>
              </Banner>
            )}
            
            {fetcher.data?.success === true && (
              <Banner status="success">
                <p>{fetcher.data.message}</p>
              </Banner>
            )}

        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <ProductFilter
                productTypes={loaderData?.productTypes || []}
                vendors={loaderData?.vendors || []}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
              
              <TagActions
                filteredCount={filteredProducts.length}
                onExecuteAction={handleExecuteAction}
                isLoading={fetcher.state === "submitting"}
              />
            </BlockStack>
          </Layout.Section>
          
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Filtered Products ({filteredProducts.length})
                  </Text>
                  {filteredProducts.length > 50 && (
                    <Text tone="subdued">Showing first 50 products</Text>
                  )}
                </InlineStack>
                
                {filteredProducts.length === 0 ? (
                  <EmptyState
                    heading="No products match your filters"
                    action={{
                      content: "Clear filters",
                      onAction: handleClearFilters,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Try adjusting your filters to see more products, or clear all filters to start over.</p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'numeric', 'text']}
                    headings={['Product Title', 'Type', 'Vendor', 'Price', 'Current Tags']}
                    rows={tableRows}
                    truncate
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Modal
          open={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Bulk Tag Operation"
          primaryAction={{
            content: 'Execute Operation',
            onAction: () => {
              const productIds = filteredProducts.map(p => p.id);
              
              fetcher.submit({
                action: pendingAction.action,
                productIds: JSON.stringify(productIds),
                tagValue: pendingAction.tagValue,
                oldTag: pendingAction.oldTag || "",
              }, { method: "POST" });
              
              setShowConfirmModal(false);
              setPendingAction(null);
            },
            loading: fetcher.state === "submitting",
          }}
          secondaryActions={[{
            content: 'Cancel',
            onAction: () => setShowConfirmModal(false),
          }]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p" variant="bodyMd">
                You are about to perform the following operation:
              </Text>
              
              <Card background="bg-surface-secondary">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Action:</strong> {
                      pendingAction?.action === "addTag" && `Add tag "${pendingAction.tagValue}"`
                    }
                    {
                      pendingAction?.action === "removeTag" && `Remove tag "${pendingAction.tagValue}"`
                    }
                    {
                      pendingAction?.action === "replaceTag" && `Replace "${pendingAction.oldTag}" with "${pendingAction.tagValue}"`
                    }
                  </Text>
                  <Text as="p" variant="bodyMd">
                    <strong>Products affected:</strong> {filteredProducts.length}
                  </Text>
                </BlockStack>
              </Card>
              
              <Banner status="warning">
                <p>This action cannot be undone. Please review your selection carefully before proceeding.</p>
              </Banner>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </BlockStack>
    </Page>
      )}
    </>
  );
}