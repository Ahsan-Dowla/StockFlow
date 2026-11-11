package com.stockflow.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StockAdjustmentRequest(
    @NotNull(message = "Product ID is required")
    Long productId,

    @NotNull(message = "Movement type is required")
    MovementType movementType,

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity,

    @NotBlank(message = "A reason or note is required for manual adjustments")
    String notes
) {}
