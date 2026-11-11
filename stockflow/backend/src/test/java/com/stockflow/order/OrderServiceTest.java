package com.stockflow.order;

import com.stockflow.customer.Customer;
import com.stockflow.customer.CustomerRepository;
import com.stockflow.exception.BusinessException;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.inventory.StockMovementRepository;
import com.stockflow.product.Product;
import com.stockflow.product.ProductRepository;
import com.stockflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private Customer testCustomer;
    private Product testProduct1;
    private Product testProduct2;

    @BeforeEach
    void setUp() {
        testCustomer = new Customer("Acme Corp", "orders@acme.com", "555-0200", "1 Industrial Way");
        testCustomer.setId(1L);

        testProduct1 = new Product("Widget A", "SKU-WDG-A", "Standard widget",
                new BigDecimal("10.00"), 50, 5, null, null);
        testProduct1.setId(101L);

        testProduct2 = new Product("Widget B", "SKU-WDG-B", "Heavy-duty widget",
                new BigDecimal("25.00"), 20, 5, null, null);
        testProduct2.setId(102L);
    }

    @Test
    @DisplayName("Create order succeeds: deducts stock, snapshots prices, records movements")
    void testCreateOrder_Success() {
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(
                        new OrderItemRequest(101L, 5),
                        new OrderItemRequest(102L, 2)
                )
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        // Return products in ascending order
        when(productRepository.findAllByIdInWithLock(List.of(101L, 102L)))
                .thenReturn(List.of(testProduct1, testProduct2));
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> {
            SalesOrder order = invocation.getArgument(0);
            order.setId(1001L);
            return order;
        });

        OrderResponse response = orderService.createOrder(request, "employee@stockflow.com");

        assertThat(response).isNotNull();
        // 5 * 10.00 + 2 * 25.00 = 50.00 + 50.00 = 100.00
        assertThat(response.totalAmount()).isEqualByComparingTo("100.00");
        assertThat(testProduct1.getCurrentStock()).isEqualTo(45);
        assertThat(testProduct2.getCurrentStock()).isEqualTo(18);

        verify(stockMovementRepository, times(2)).save(any());
        verify(productRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Create order fails when stock is insufficient")
    void testCreateOrder_InsufficientStock_ThrowsException() {
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(new OrderItemRequest(101L, 100)) // Available: 50
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(productRepository.findAllByIdInWithLock(List.of(101L)))
                .thenReturn(List.of(testProduct1));

        assertThatThrownBy(() -> orderService.createOrder(request, "employee@stockflow.com"))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Available: 50")
                .hasMessageContaining("Requested: 100");

        assertThat(testProduct1.getCurrentStock()).isEqualTo(50); // Unaltered
        verify(salesOrderRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create order fails when product is inactive")
    void testCreateOrder_InactiveProduct_ThrowsException() {
        testProduct1.setActive(false);
        CreateOrderRequest request = new CreateOrderRequest(
                1L,
                List.of(new OrderItemRequest(101L, 5))
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));
        when(productRepository.findAllByIdInWithLock(List.of(101L)))
                .thenReturn(List.of(testProduct1));

        assertThatThrownBy(() -> orderService.createOrder(request, "employee@stockflow.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactive product");

        verify(salesOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cancel order restores stock and creates reversal audit movements")
    void testCancelOrder_Success_RestoresStock() {
        testProduct1.setCurrentStock(45); // Deducted previously

        SalesOrder order = new SalesOrder("ORD-20261111-00001", testCustomer, null);
        order.setId(500L);
        order.setStatus(OrderStatus.CONFIRMED);
        OrderItem item = new OrderItem(testProduct1, 5, new BigDecimal("10.00"));
        order.addItem(item);

        when(salesOrderRepository.findById(500L)).thenReturn(Optional.of(order));
        when(productRepository.findAllByIdInWithLock(List.of(101L))).thenReturn(List.of(testProduct1));
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.cancelOrder(500L, "manager@stockflow.com");

        assertThat(response.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(testProduct1.getCurrentStock()).isEqualTo(50); // Restored!
        verify(stockMovementRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Duplicate order cancellation is prevented from restoring stock twice")
    void testCancelOrder_AlreadyCancelled_ThrowsException() {
        SalesOrder order = new SalesOrder("ORD-20261111-00001", testCustomer, null);
        order.setId(500L);
        order.setStatus(OrderStatus.CANCELLED);

        when(salesOrderRepository.findById(500L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(500L, "manager@stockflow.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already cancelled");

        verify(productRepository, never()).findAllByIdInWithLock(any());
        verify(stockMovementRepository, never()).save(any());
    }
}
