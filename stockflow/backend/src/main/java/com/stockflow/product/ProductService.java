package com.stockflow.product;

import com.stockflow.category.Category;
import com.stockflow.category.CategoryRepository;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.inventory.MovementType;
import com.stockflow.inventory.StockMovement;
import com.stockflow.inventory.StockMovementRepository;
import com.stockflow.supplier.Supplier;
import com.stockflow.supplier.SupplierRepository;
import com.stockflow.user.User;
import com.stockflow.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          SupplierRepository supplierRepository,
                          StockMovementRepository stockMovementRepository,
                          UserRepository userRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(String search, Long categoryId, Long supplierId, Boolean active, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(ProductResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ProductResponse.fromEntity(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getLowStockProducts(Pageable pageable) {
        return productRepository.findLowStockProducts(pageable).map(ProductResponse::fromEntity);
    }

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request, String currentUserEmail) {
        if (productRepository.existsBySkuIgnoreCase(request.sku().trim())) {
            throw new DuplicateResourceException("Product", "SKU", request.sku().trim());
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        Supplier supplier = null;
        if (request.supplierId() != null) {
            supplier = supplierRepository.findById(request.supplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.supplierId()));
        }

        int initialStock = request.currentStock() != null ? request.currentStock() : 0;
        int reorderLevel = request.reorderLevel() != null ? request.reorderLevel() : 10;

        Product product = new Product(
                request.name().trim(),
                request.sku().trim().toUpperCase(),
                request.description(),
                request.unitPrice(),
                initialStock,
                reorderLevel,
                category,
                supplier
        );

        Product savedProduct = productRepository.save(product);

        // Record initial inventory movement if stock > 0
        if (initialStock > 0) {
            User user = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;
            StockMovement movement = new StockMovement(
                    savedProduct,
                    MovementType.STOCK_IN,
                    initialStock,
                    "INITIAL_STOCK",
                    savedProduct.getId(),
                    "Initial stock added on product creation",
                    user
            );
            stockMovementRepository.save(movement);
        }

        return ProductResponse.fromEntity(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (productRepository.existsBySkuIgnoreCaseAndIdNot(request.sku().trim(), id)) {
            throw new DuplicateResourceException("Product", "SKU", request.sku().trim());
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        Supplier supplier = null;
        if (request.supplierId() != null) {
            supplier = supplierRepository.findById(request.supplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.supplierId()));
        }

        product.setName(request.name().trim());
        product.setSku(request.sku().trim().toUpperCase());
        product.setDescription(request.description());
        product.setUnitPrice(request.unitPrice());
        if (request.reorderLevel() != null) {
            product.setReorderLevel(request.reorderLevel());
        }
        product.setCategory(category);
        product.setSupplier(supplier);

        // Note: currentStock is untouched here to prevent silent overrides
        Product updated = productRepository.save(product);
        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setActive(false);
        productRepository.save(product);
    }
}
