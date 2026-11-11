package com.stockflow.dashboard;

import com.stockflow.customer.CustomerRepository;
import com.stockflow.order.OrderItemRepository;
import com.stockflow.order.OrderResponse;
import com.stockflow.order.SalesOrderRepository;
import com.stockflow.product.ProductRepository;
import com.stockflow.supplier.SupplierRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final OrderItemRepository orderItemRepository;

    public DashboardService(ProductRepository productRepository,
                            CustomerRepository customerRepository,
                            SupplierRepository supplierRepository,
                            SalesOrderRepository salesOrderRepository,
                            OrderItemRepository orderItemRepository) {
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        long totalProducts = productRepository.countByActiveTrue();
        long totalCustomers = customerRepository.countByActiveTrue();
        long totalSuppliers = supplierRepository.countByActiveTrue();
        long totalOrders = salesOrderRepository.count();
        Long totalStock = productRepository.sumTotalStock();
        long lowStockCount = productRepository.countLowStockProducts();
        BigDecimal confirmedRevenue = salesOrderRepository.sumConfirmedRevenue();

        return new DashboardSummaryResponse(
                totalProducts,
                totalCustomers,
                totalSuppliers,
                totalOrders,
                totalStock != null ? totalStock : 0L,
                lowStockCount,
                confirmedRevenue != null ? confirmedRevenue : BigDecimal.ZERO
        );
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts() {
        List<Object[]> rows = orderItemRepository.findTopSellingProducts(PageRequest.of(0, 5));
        return rows.stream().map(row -> new TopProductResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (String) row[2],
                ((Number) row[3]).longValue(),
                (BigDecimal) row[4]
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<MonthlyRevenueResponse> getMonthlyRevenue() {
        List<Object[]> rows = salesOrderRepository.findMonthlyRevenue();
        return rows.stream().map(row -> new MonthlyRevenueResponse(
                (String) row[0],
                (BigDecimal) row[1]
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryDistributionResponse> getCategoryDistribution() {
        List<Object[]> rows = productRepository.findStockDistributionByCategory();
        return rows.stream().map(row -> new CategoryDistributionResponse(
                (String) row[0],
                ((Number) row[1]).longValue()
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getRecentOrders() {
        return salesOrderRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }
}
