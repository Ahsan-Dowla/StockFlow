package com.stockflow.product;

import com.stockflow.category.Category;
import com.stockflow.category.CategoryRepository;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.inventory.StockMovementRepository;
import com.stockflow.supplier.Supplier;
import com.stockflow.supplier.SupplierRepository;
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
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProductService productService;

    private Category testCategory;
    private Supplier testSupplier;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testCategory = new Category("Electronics", "Electronic components");
        testCategory.setId(1L);

        testSupplier = new Supplier("Apex Tech", "apex@example.com", "555-0100", "123 Tech Lane");
        testSupplier.setId(1L);

        testProduct = new Product("Sensor Module", "SKU-SENS-01", "Precision sensor",
                new BigDecimal("29.99"), 50, 10, testCategory, testSupplier);
        testProduct.setId(10L);
    }

    @Test
    @DisplayName("Successfully creates product and records initial stock movement")
    void testCreateProduct_Success() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Sensor Module", "SKU-SENS-01", "Precision sensor",
                new BigDecimal("29.99"), 50, 10, 1L, 1L
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-SENS-01")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(testSupplier));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        ProductResponse response = productService.createProduct(request, "admin@stockflow.com");

        assertThat(response).isNotNull();
        assertThat(response.sku()).isEqualTo("SKU-SENS-01");
        assertThat(response.currentStock()).isEqualTo(50);
        verify(stockMovementRepository, times(1)).save(any());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("Rejects product creation with duplicate SKU")
    void testCreateProduct_DuplicateSku_ThrowsDuplicateResourceException() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Sensor Module", "SKU-DUPE", "Precision sensor",
                new BigDecimal("29.99"), 50, 10, 1L, 1L
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-DUPE")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(request, "admin@stockflow.com"))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("SKU");

        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Updating product does not silently modify stock quantity")
    void testUpdateProduct_Success_DoesNotAlterStock() {
        ProductUpdateRequest request = new ProductUpdateRequest(
                "Updated Sensor", "SKU-SENS-01", "New description",
                new BigDecimal("34.99"), 15, 1L, 1L
        );

        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(productRepository.existsBySkuIgnoreCaseAndIdNot("SKU-SENS-01", 10L)).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(testSupplier));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.updateProduct(10L, request);

        assertThat(response.name()).isEqualTo("Updated Sensor");
        assertThat(response.unitPrice()).isEqualByComparingTo("34.99");
        assertThat(response.currentStock()).isEqualTo(50); // Stock remains unchanged!
        assertThat(response.reorderLevel()).isEqualTo(15);
    }

    @Test
    @DisplayName("Deactivate product soft-deletes the product record")
    void testDeactivateProduct_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));

        productService.deactivateProduct(10L);

        assertThat(testProduct.isActive()).isFalse();
        verify(productRepository, times(1)).save(testProduct);
    }

    @Test
    @DisplayName("Throws ResourceNotFoundException when product not found")
    void testGetProductById_NotFound() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
