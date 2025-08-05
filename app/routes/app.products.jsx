import { json } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { 
  Page, 
  Card, 
  IndexTable, 
  Text, 
  Badge,
  Layout,
  TextField,
  Select,
  Button,
  InlineStack,
  BlockStack
} from '@shopify/polaris';

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Parse query parameters for filtering
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('query') || '';
  const vendor = url.searchParams.get('vendor') || '';
  const tag = url.searchParams.get('tag') || '';
  
  // Build GraphQL query string
  let graphqlQuery = [];
  if (searchQuery) graphqlQuery.push(`title:*${searchQuery}*`);
  if (vendor) graphqlQuery.push(`vendor:'${vendor}'`);
  if (tag) graphqlQuery.push(`tag:'${tag}'`);
  
  const queryString = graphqlQuery.length > 0 ? graphqlQuery.join(' AND ') : '';
  
  const response = await admin.graphql(`
    query getProducts($first: Int!, $query: String) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            tags
            vendor
            productType
            status
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `, {
    variables: { 
      first: 50,
      query: queryString
    }
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  
  const products = data.data.products.edges.map(edge => edge.node);
  
  // Get unique vendors and tags for filter dropdowns
  const vendors = [...new Set(products.map(p => p.vendor).filter(Boolean))].sort();
  const allTags = [...new Set(products.flatMap(p => p.tags))].sort();
  
  return json({
    products,
    vendors,
    allTags,
    filters: {
      searchQuery,
      vendor,
      tag
    }
  });
};

export default function ProductsPage() {
  const { products, vendors, allTags, filters } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const vendorOptions = [
    { label: 'All vendors', value: '' },
    ...vendors.map(vendor => ({ label: vendor, value: vendor }))
  ];

  const tagOptions = [
    { label: 'All tags', value: '' },
    ...allTags.map(tag => ({ label: tag, value: tag }))
  ];

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row
      id={product.id}
      key={product.id}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold">
          {product.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd">
          {product.vendor || '—'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd">
          {product.productType || '—'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="100" wrap={false}>
          {product.tags.length > 0 ? (
            product.tags.slice(0, 3).map(tag => (
              <Badge key={tag} size="small">{tag}</Badge>
            ))
          ) : (
            <Text tone="subdued">No tags</Text>
          )}
          {product.tags.length > 3 && (
            <Badge size="small" tone="info">
              +{product.tags.length - 3} more
            </Badge>
          )}
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd">
          ${product.variants.edges[0]?.node.price || 'N/A'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge 
          tone={product.status === 'ACTIVE' ? 'success' : 'subdued'}
        >
          {product.status}
        </Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page 
      title="Product Browser"
      subtitle={`${products.length} products found`}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Filter Products
              </Text>
              
              <InlineStack gap="400" wrap>
                <div style={{ minWidth: '200px' }}>
                  <TextField
                    label="Search by title"
                    value={filters.searchQuery}
                    onChange={(value) => handleFilterChange('query', value)}
                    placeholder="Enter product title..."
                    clearButton
                    onClearButtonClick={() => handleFilterChange('query', '')}
                  />
                </div>
                
                <div style={{ minWidth: '150px' }}>
                  <Select
                    label="Vendor"
                    options={vendorOptions}
                    value={filters.vendor}
                    onChange={(value) => handleFilterChange('vendor', value)}
                  />
                </div>
                
                <div style={{ minWidth: '150px' }}>
                  <Select
                    label="Has tag"
                    options={tagOptions}
                    value={filters.tag}
                    onChange={(value) => handleFilterChange('tag', value)}
                  />
                </div>
                
                <div style={{ alignSelf: 'flex-end' }}>
                  <Button onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              headings={[
                { title: 'Product Title' },
                { title: 'Vendor' },
                { title: 'Product Type' },
                { title: 'Tags' },
                { title: 'Price' },
                { title: 'Status' },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
            
            {products.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Text tone="subdued">
                  No products match your current filters. Try adjusting your search criteria.
                </Text>
              </div>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
