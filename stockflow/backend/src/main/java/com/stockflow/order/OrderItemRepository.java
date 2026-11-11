package com.stockflow.order;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findBySalesOrderId(Long salesOrderId);

    @Query("SELECT oi.product.id, oi.product.name, oi.product.sku, SUM(oi.quantity), SUM(oi.subtotal) " +
           "FROM OrderItem oi WHERE oi.salesOrder.status = com.stockflow.order.OrderStatus.CONFIRMED " +
           "GROUP BY oi.product.id, oi.product.name, oi.product.sku " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(Pageable pageable);
}
