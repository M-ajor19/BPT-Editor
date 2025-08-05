import { useState } from "react";
import {
  Card,
  BlockStack,
  TextField,
  Select,
  Button,
  Text,
  Banner,
  InlineStack,
} from "@shopify/polaris";

export function TagActions({ 
  filteredCount,
  onExecuteAction,
  isLoading 
}) {
  const [selectedAction, setSelectedAction] = useState("addTag");
  const [tagValue, setTagValue] = useState("");
  const [oldTag, setOldTag] = useState("");

  const actionOptions = [
    { label: "Add Tag", value: "addTag" },
    { label: "Remove Tag", value: "removeTag" }, 
    { label: "Replace Tag", value: "replaceTag" },
  ];

  const handleExecute = () => {
    if (!tagValue.trim()) return;
    
    onExecuteAction({
      action: selectedAction,
      tagValue: tagValue.trim(),
      oldTag: oldTag.trim(),
    });
  };

  const isDisabled = filteredCount === 0 || !tagValue.trim() || 
    (selectedAction === "replaceTag" && !oldTag.trim());

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">One-Click Actions</Text>
        
        <Select
          label="Choose Action"
          options={actionOptions}
          value={selectedAction}
          onChange={setSelectedAction}
          helpText="Select the type of tag operation to perform"
        />
        
        {selectedAction === "addTag" && (
          <TextField
            label="Tag to Add"
            value={tagValue}
            onChange={setTagValue}
            placeholder="e.g., summer2025, clearance, bestseller"
            helpText="Enter the tag you want to add to all filtered products"
          />
        )}
        
        {selectedAction === "removeTag" && (
          <TextField
            label="Tag to Remove"
            value={tagValue}
            onChange={setTagValue}
            placeholder="e.g., spring2025, old-sale, discontinued"
            helpText="Enter the tag you want to remove from all filtered products"
          />
        )}
        
        {selectedAction === "replaceTag" && (
          <BlockStack gap="300">
            <TextField
              label="Old Tag (to replace)"
              value={oldTag}
              onChange={setOldTag}
              placeholder="e.g., spring2025"
              helpText="Tag that will be replaced"
            />
            <TextField
              label="New Tag (replacement)"
              value={tagValue}
              onChange={setTagValue}
              placeholder="e.g., summer2025"
              helpText="Tag that will replace the old one"
            />
          </BlockStack>
        )}
        
        {filteredCount > 0 && (
          <Banner status="info">
            <p>
              This action will affect <strong>{filteredCount} products</strong>.
              {filteredCount > 100 && " Large operations may take a few minutes to complete."}
            </p>
          </Banner>
        )}
        
        {filteredCount === 0 && (
          <Banner status="warning">
            <p>No products match your current filters. Adjust your filters to see products.</p>
          </Banner>
        )}
        
        <Button 
          variant="primary" 
          size="large"
          onClick={handleExecute}
          disabled={isDisabled}
          loading={isLoading}
        >
          {isLoading ? "Processing..." : `Apply to ${filteredCount} Products`}
        </Button>
        
        <Text as="p" variant="bodySm" tone="subdued">
          {selectedAction === "addTag" && `Add "${tagValue}" to all filtered products`}
          {selectedAction === "removeTag" && `Remove "${tagValue}" from all filtered products`}
          {selectedAction === "replaceTag" && `Replace "${oldTag}" with "${tagValue}" in all filtered products`}
        </Text>
      </BlockStack>
    </Card>
  );
}
