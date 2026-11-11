package com.stockflow.dashboard;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
    long totalProducts,
    long totalCustomers,
    long totalSuppliers,
    long totalOrders,
    long totalInventoryUnits,
    long lowStockCount,
    BigDecimal totalConfirmedRevenue
) {}
