package com.stockflow.dashboard;

import java.math.BigDecimal;

public record MonthlyRevenueResponse(
    String month,
    BigDecimal revenue
) {}
