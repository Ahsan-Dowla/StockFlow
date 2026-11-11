package com.stockflow.product;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductCreateRequest(
    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must not exceed 150 characters")
    String name,

    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    String sku,

    String description,

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Unit price cannot be negative")
    BigDecimal unitPrice,

    @Min(value = 0, message = "Initial stock cannot be negative")
    Integer currentStock,

    @Min(value = 0, message = "Reorder level cannot be negative")
    Integer reorderLevel,

    @NotNull(message = "Category ID is required")
    Long categoryId,

    Long supplierId
) {}
