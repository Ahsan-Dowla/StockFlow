package com.stockflow.inventory;

import com.stockflow.exception.BusinessException;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.product.Product;
import com.stockflow.product.ProductRepository;
import com.stockflow.user.User;
import com.stockflow.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    public InventoryService(ProductRepository productRepository,
                            StockMovementRepository stockMovementRepository,
                            UserRepository userRepository) {
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StockMovementResponse adjustStock(StockAdjustmentRequest request, String currentUserEmail) {
        // Pessimistic lock on product to prevent concurrent race conditions
        Product product = productRepository.findByIdWithLock(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.productId()));

        if (!product.isActive()) {
            throw new BusinessException("Cannot adjust inventory for inactive product: " + product.getName());
        }

        int current = product.getCurrentStock();
        int delta;

        if (request.movementType() == MovementType.STOCK_IN) {
            delta = request.quantity();
        } else if (request.movementType() == MovementType.STOCK_OUT) {
            if (current < request.quantity()) {
                throw new InsufficientStockException(product.getName(), current, request.quantity());
            }
            delta = -request.quantity();
        } else { // ADJUSTMENT
            // Positive or negative adjustment based on sign or context
            // Here quantity represents the change requested
            delta = request.quantity();
            if (current + delta < 0) {
                throw new InsufficientStockException(product.getName(), current, Math.abs(delta));
            }
        }

        int newStock = current + delta;
        product.setCurrentStock(newStock);
        productRepository.save(product);

        User user = currentUserEmail != null ? userRepository.findByEmail(currentUserEmail).orElse(null) : null;

        StockMovement movement = new StockMovement(
                product,
                request.movementType(),
                delta,
                "MANUAL_ADJUSTMENT",
                null,
                request.notes().trim(),
                user
        );
        StockMovement saved = stockMovementRepository.save(movement);
        return StockMovementResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> getMovements(Long productId, Pageable pageable) {
        if (productId != null) {
            return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                    .map(StockMovementResponse::fromEntity);
        }
        return stockMovementRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(StockMovementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary() {
        long totalProducts = productRepository.countByActiveTrue();
        Long totalStockUnits = productRepository.sumTotalStock();
        long lowStockCount = productRepository.countLowStockProducts();

        List<Object[]> rawDistribution = productRepository.findStockDistributionByCategory();
        List<InventorySummaryResponse.CategoryStockSummary> categoryDistribution = rawDistribution.stream()
                .map(row -> new InventorySummaryResponse.CategoryStockSummary(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();

        return new InventorySummaryResponse(
                totalProducts,
                totalStockUnits != null ? totalStockUnits : 0L,
                lowStockCount,
                categoryDistribution
        );
    }
}
