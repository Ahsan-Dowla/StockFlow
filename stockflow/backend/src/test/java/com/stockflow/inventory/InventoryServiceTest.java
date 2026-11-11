package com.stockflow.inventory;

import com.stockflow.category.Category;
import com.stockflow.exception.InsufficientStockException;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        Category category = new Category("Hardware", "Tools and hardware");
        category.setId(1L);

        testProduct = new Product("Titanium Bolt", "SKU-BOLT-01", "Grade 5 bolt",
                new BigDecimal("5.00"), 100, 20, category, null);
        testProduct.setId(5L);
    }

    @Test
    @DisplayName("Stock In increases balance and records auditable movement")
    void testStockIn_Success() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(5L, MovementType.STOCK_IN, 25, "Restock from shipment");

        when(productRepository.findByIdWithLock(5L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockMovementResponse response = inventoryService.adjustStock(request, "admin@stockflow.com");

        assertThat(testProduct.getCurrentStock()).isEqualTo(125);
        assertThat(response.quantityChange()).isEqualTo(25);
        assertThat(response.movementType()).isEqualTo(MovementType.STOCK_IN);
        verify(productRepository, times(1)).save(testProduct);
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
    }

    @Test
    @DisplayName("Stock Out decreases balance and records auditable movement")
    void testStockOut_Success() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(5L, MovementType.STOCK_OUT, 40, "Damaged stock disposal");

        when(productRepository.findByIdWithLock(5L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockMovementResponse response = inventoryService.adjustStock(request, "admin@stockflow.com");

        assertThat(testProduct.getCurrentStock()).isEqualTo(60);
        assertThat(response.quantityChange()).isEqualTo(-40);
        assertThat(response.movementType()).isEqualTo(MovementType.STOCK_OUT);
    }

    @Test
    @DisplayName("Stock Out fails when requested quantity exceeds available stock")
    void testStockOut_InsufficientStock_ThrowsException() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(5L, MovementType.STOCK_OUT, 150, "Excess removal");

        when(productRepository.findByIdWithLock(5L)).thenReturn(Optional.of(testProduct));

        assertThatThrownBy(() -> inventoryService.adjustStock(request, "admin@stockflow.com"))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Available: 100")
                .hasMessageContaining("Requested: 150");

        assertThat(testProduct.getCurrentStock()).isEqualTo(100); // Unaltered
        verify(stockMovementRepository, never()).save(any());
    }
}
