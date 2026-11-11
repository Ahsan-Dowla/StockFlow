package com.stockflow.dashboard;

import com.stockflow.order.OrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Dashboard analytics and real-time business performance metrics")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get high-level summary KPIs (counts, total stock, confirmed revenue)")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/top-products")
    @Operation(summary = "Get top 5 best-selling products by quantity and revenue")
    public ResponseEntity<List<TopProductResponse>> getTopProducts() {
        return ResponseEntity.ok(dashboardService.getTopProducts());
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get monthly confirmed revenue trends")
    public ResponseEntity<List<MonthlyRevenueResponse>> getMonthlyRevenue() {
        return ResponseEntity.ok(dashboardService.getMonthlyRevenue());
    }

    @GetMapping("/category-distribution")
    @Operation(summary = "Get current inventory units grouped by category")
    public ResponseEntity<List<CategoryDistributionResponse>> getCategoryDistribution() {
        return ResponseEntity.ok(dashboardService.getCategoryDistribution());
    }

    @GetMapping("/recent-orders")
    @Operation(summary = "Get 5 most recent sales orders")
    public ResponseEntity<List<OrderResponse>> getRecentOrders() {
        return ResponseEntity.ok(dashboardService.getRecentOrders());
    }
}
