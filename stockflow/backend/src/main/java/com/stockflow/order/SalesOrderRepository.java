package com.stockflow.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {

    Optional<SalesOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    Page<SalesOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM SalesOrder o WHERE o.status = com.stockflow.order.OrderStatus.CONFIRMED")
    BigDecimal sumConfirmedRevenue();

    @Query("SELECT FUNCTION('TO_CHAR', o.createdAt, 'YYYY-MM') AS month, SUM(o.totalAmount) AS revenue " +
           "FROM SalesOrder o WHERE o.status = com.stockflow.order.OrderStatus.CONFIRMED " +
           "GROUP BY FUNCTION('TO_CHAR', o.createdAt, 'YYYY-MM') " +
           "ORDER BY month ASC")
    List<Object[]> findMonthlyRevenue();

    List<SalesOrder> findTop5ByOrderByCreatedAtDesc();
}
