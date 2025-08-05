import { useState } from "react";
import {
  Card,
  BlockStack,
  TextField,
  Select,
  RangeSlider,
  Button,
  Text,
  InlineStack,
} from "@shopify/polaris";

export function ProductFilter({ 
  productTypes, 
  vendors, 
  filters,
  onFilterChange,
  onClearFilters 
}) {
  const productTypeOptions = [
    { label: "All Product Types", value: "" },
    ...productTypes.map(type => ({ label: type, value: type }))
  ];

  const vendorOptions = [
    { label: "All Vendors", value: "" },
    ...vendors.map(vendor => ({ label: vendor, value: vendor }))
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">Smart Filters</Text>
        
        <TextField
          label="Product Title Contains"
          value={filters.titleFilter}
          onChange={(value) => onFilterChange('titleFilter', value)}
          placeholder="e.g., T-shirt, Sweater, Hat"
          helpText="Find products by searching within their titles"
        />
        
        <Select
          label="Product Type Is"
          options={productTypeOptions}
          value={filters.productTypeFilter}
          onChange={(value) => onFilterChange('productTypeFilter', value)}
          helpText="Filter by specific product categories"
        />
        
        <Select
          label="Vendor Is"
          options={vendorOptions}
          value={filters.vendorFilter}
          onChange={(value) => onFilterChange('vendorFilter', value)}
          helpText="Filter by brand or supplier"
        />
        
        <div>
          <Text as="p" variant="bodyMd" tone="subdued">
            Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </Text>
          <RangeSlider
            label="Price Range"
            value={filters.priceRange}
            onChange={(value) => onFilterChange('priceRange', value)}
            output
            min={0}
            max={1000}
            step={5}
            prefix="$"
          />
        </div>
        
        <TextField
          label="Has Tag"
          value={filters.hasTagFilter}
          onChange={(value) => onFilterChange('hasTagFilter', value)}
          placeholder="e.g., sale, new, featured"
          helpText="Show only products that have this tag"
        />
        
        <TextField
          label="Does Not Have Tag"
          value={filters.doesNotHaveTagFilter}
          onChange={(value) => onFilterChange('doesNotHaveTagFilter', value)}
          placeholder="e.g., clearance, old, discontinued"
          helpText="Exclude products that have this tag"
        />
        
        <InlineStack gap="200">
          <Button onClick={onClearFilters} variant="plain" size="slim">
            Clear All Filters
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
