package com.stockflow.product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
    Long id,
    String name,
    String sku,
    String description,
    BigDecimal unitPrice,
    Integer currentStock,
    Integer reorderLevel,
    boolean active,
    boolean lowStock,
    Long categoryId,
    String categoryName,
    Long supplierId,
    String supplierName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ProductResponse fromEntity(Product product) {
        return new ProductResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getDescription(),
            product.getUnitPrice(),
            product.getCurrentStock(),
            product.getReorderLevel(),
            product.isActive(),
            product.isLowStock(),
            product.getCategory() != null ? product.getCategory().getId() : null,
            product.getCategory() != null ? product.getCategory().getName() : null,
            product.getSupplier() != null ? product.getSupplier().getId() : null,
            product.getSupplier() != null ? product.getSupplier().getName() : null,
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }
}
