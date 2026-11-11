package com.stockflow.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
    Long id,
    String orderNumber,
    Long customerId,
    String customerName,
    String customerEmail,
    OrderStatus status,
    BigDecimal totalAmount,
    Long createdById,
    String createdByName,
    List<OrderItemResponse> items,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static OrderResponse fromEntity(SalesOrder order) {
        List<OrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream().map(OrderItemResponse::fromEntity).toList()
                : List.of();

        return new OrderResponse(
            order.getId(),
            order.getOrderNumber(),
            order.getCustomer().getId(),
            order.getCustomer().getName(),
            order.getCustomer().getEmail(),
            order.getStatus(),
            order.getTotalAmount(),
            order.getCreatedBy() != null ? order.getCreatedBy().getId() : null,
            order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null,
            itemResponses,
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }
}
