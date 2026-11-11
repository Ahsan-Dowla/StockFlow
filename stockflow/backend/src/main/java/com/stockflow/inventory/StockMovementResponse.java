package com.stockflow.inventory;

import java.time.LocalDateTime;

public record StockMovementResponse(
    Long id,
    Long productId,
    String productName,
    String productSku,
    MovementType movementType,
    Integer quantityChange,
    String referenceType,
    Long referenceId,
    String notes,
    Long performedById,
    String performedByName,
    LocalDateTime createdAt
) {
    public static StockMovementResponse fromEntity(StockMovement movement) {
        return new StockMovementResponse(
            movement.getId(),
            movement.getProduct().getId(),
            movement.getProduct().getName(),
            movement.getProduct().getSku(),
            movement.getMovementType(),
            movement.getQuantityChange(),
            movement.getReferenceType(),
            movement.getReferenceId(),
            movement.getNotes(),
            movement.getPerformedBy() != null ? movement.getPerformedBy().getId() : null,
            movement.getPerformedBy() != null ? movement.getPerformedBy().getFullName() : null,
            movement.getCreatedAt()
        );
    }
}
