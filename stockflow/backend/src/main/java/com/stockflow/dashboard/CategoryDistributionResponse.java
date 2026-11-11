package com.stockflow.dashboard;

public record CategoryDistributionResponse(
    String categoryName,
    long stockQuantity
) {}
