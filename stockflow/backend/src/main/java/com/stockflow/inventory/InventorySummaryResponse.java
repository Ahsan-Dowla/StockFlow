package com.stockflow.inventory;

import java.util.List;

public record InventorySummaryResponse(
    long totalProducts,
    long totalInventoryUnits,
    long lowStockCount,
    List<CategoryStockSummary> categoryDistribution
) {
    public record CategoryStockSummary(
        String categoryName,
        long totalStock
    ) {}
}
