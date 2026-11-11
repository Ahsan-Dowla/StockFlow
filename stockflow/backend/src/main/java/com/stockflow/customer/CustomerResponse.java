package com.stockflow.customer;

import java.time.LocalDateTime;

public record CustomerResponse(
    Long id,
    String name,
    String email,
    String phone,
    String address,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CustomerResponse fromEntity(Customer customer) {
        return new CustomerResponse(
            customer.getId(),
            customer.getName(),
            customer.getEmail(),
            customer.getPhone(),
            customer.getAddress(),
            customer.isActive(),
            customer.getCreatedAt(),
            customer.getUpdatedAt()
        );
    }
}
