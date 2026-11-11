package com.stockflow.dashboard;

import java.math.BigDecimal;

public record TopProductResponse(
    Long productId,
    String productName,
    String sku,
    long totalQuantitySold,
    BigDecimal totalRevenue
) {}
