package com.stockflow.order;

import com.stockflow.customer.Customer;
import com.stockflow.customer.CustomerRepository;
import com.stockflow.exception.BusinessException;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.inventory.MovementType;
import com.stockflow.inventory.StockMovement;
import com.stockflow.inventory.StockMovementRepository;
import com.stockflow.product.Product;
import com.stockflow.product.ProductRepository;
import com.stockflow.user.User;
import com.stockflow.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final AtomicLong ORDER_COUNTER = new AtomicLong(System.currentTimeMillis() % 100000);

    private final SalesOrderRepository salesOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    public OrderService(SalesOrderRepository salesOrderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        CustomerRepository customerRepository,
                        StockMovementRepository stockMovementRepository,
                        UserRepository userRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String currentUserEmail) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.customerId()));

        if (!customer.isActive()) {
            throw new BusinessException("Cannot create order for inactive customer: " + customer.getName());
        }

        // Aggregate repeated product lines in the submitted order
        Map<Long, Integer> productQuantities = request.items().stream()
                .collect(Collectors.groupingBy(
                        OrderItemRequest::productId,
                        Collectors.summingInt(OrderItemRequest::quantity)
                ));

        // Deterministic lock ordering: sort product IDs in ascending order to prevent deadlocks
        List<Long> sortedProductIds = productQuantities.keySet().stream().sorted().toList();
        List<Product> lockedProducts = productRepository.findAllByIdInWithLock(sortedProductIds);

        if (lockedProducts.size() != sortedProductIds.size()) {
            Set<Long> foundIds = lockedProducts.stream().map(Product::getId).collect(Collectors.toSet());
            Long missingId = sortedProductIds.stream().filter(id -> !foundIds.contains(id)).findFirst().orElse(null);
            throw new ResourceNotFoundException("Product", "id", missingId);
        }

        Map<Long, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Validate all products are active and have sufficient stock
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productMap.get(entry.getKey());
            int requestedQuantity = entry.getValue();

            if (!product.isActive()) {
                throw new BusinessException("Cannot order inactive product: " + product.getName());
            }

            if (product.getCurrentStock() < requestedQuantity) {
                throw new InsufficientStockException(product.getName(), product.getCurrentStock(), requestedQuantity);
            }
        }

        User user = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;

        // Generate unique readable order number
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String orderNumber = String.format("ORD-%s-%05d", datePrefix, ORDER_COUNTER.incrementAndGet());

        SalesOrder order = new SalesOrder(orderNumber, customer, user);
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<StockMovement> movements = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productMap.get(entry.getKey());
            int quantity = entry.getValue();

            // Price snapshot at order creation time
            BigDecimal unitPrice = product.getUnitPrice();
            OrderItem item = new OrderItem(product, quantity, unitPrice);
            order.addItem(item);

            totalAmount = totalAmount.add(item.getSubtotal());

            // Deduct stock atomically
            product.setCurrentStock(product.getCurrentStock() - quantity);

            // Create movement record
            StockMovement movement = new StockMovement(
                    product,
                    MovementType.STOCK_OUT,
                    -quantity,
                    "SALES_ORDER",
                    null, // updated with order id after persist
                    "Stock deducted for order " + orderNumber,
                    user
            );
            movements.add(movement);
        }

        order.setTotalAmount(totalAmount);
        SalesOrder savedOrder = salesOrderRepository.save(order);

        // Update referenceId on movements and persist
        for (StockMovement movement : movements) {
            movement.setReferenceId(savedOrder.getId());
            stockMovementRepository.save(movement);
        }

        // Save updated product balances
        productRepository.saveAll(lockedProducts);

        return OrderResponse.fromEntity(savedOrder);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, String currentUserEmail) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", id));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Order " + order.getOrderNumber() + " is already cancelled");
        }

        // Lock products in deterministic ascending order
        List<Long> productIds = order.getItems().stream()
                .map(item -> item.getProduct().getId())
                .distinct()
                .sorted()
                .toList();

        List<Product> lockedProducts = productRepository.findAllByIdInWithLock(productIds);
        Map<Long, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        User user = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;

        // Restore stock and record reversal movements
        for (OrderItem item : order.getItems()) {
            Product product = productMap.get(item.getProduct().getId());
            if (product != null) {
                product.setCurrentStock(product.getCurrentStock() + item.getQuantity());

                StockMovement reversal = new StockMovement(
                        product,
                        MovementType.STOCK_IN,
                        item.getQuantity(),
                        "ORDER_CANCELLATION",
                        order.getId(),
                        "Stock restored from cancelled order " + order.getOrderNumber(),
                        user
                );
                stockMovementRepository.save(reversal);
            }
        }

        productRepository.saveAll(lockedProducts);

        order.setStatus(OrderStatus.CANCELLED);
        SalesOrder cancelled = salesOrderRepository.save(order);
        return OrderResponse.fromEntity(cancelled);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", id));
        return OrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(String orderNumber, OrderStatus status, Long customerId, Pageable pageable) {
        Specification<SalesOrder> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (orderNumber != null && !orderNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("orderNumber")), "%" + orderNumber.trim().toLowerCase() + "%"));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return salesOrderRepository.findAll(spec, pageable).map(OrderResponse::fromEntity);
    }
}
