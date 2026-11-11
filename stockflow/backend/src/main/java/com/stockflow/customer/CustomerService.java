package com.stockflow.customer;

import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable).map(CustomerResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> getActiveCustomers() {
        return customerRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(CustomerResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return CustomerResponse.fromEntity(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> searchCustomers(String query, Pageable pageable) {
        return customerRepository.searchCustomers(query, pageable).map(CustomerResponse::fromEntity);
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (request.email() != null && !request.email().isBlank()) {
            if (customerRepository.existsByEmailIgnoreCase(request.email().trim())) {
                throw new DuplicateResourceException("Customer", "email", request.email().trim());
            }
        }

        Customer customer = new Customer(
                request.name().trim(),
                request.email() != null && !request.email().isBlank() ? request.email().trim() : null,
                request.phone() != null ? request.phone().trim() : null,
                request.address() != null ? request.address().trim() : null
        );
        Customer saved = customerRepository.save(customer);
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        if (request.email() != null && !request.email().isBlank()) {
            if (customerRepository.existsByEmailIgnoreCaseAndIdNot(request.email().trim(), id)) {
                throw new DuplicateResourceException("Customer", "email", request.email().trim());
            }
            customer.setEmail(request.email().trim());
        } else {
            customer.setEmail(null);
        }

        customer.setName(request.name().trim());
        customer.setPhone(request.phone() != null ? request.phone().trim() : null);
        customer.setAddress(request.address() != null ? request.address().trim() : null);

        Customer updated = customerRepository.save(customer);
        return CustomerResponse.fromEntity(updated);
    }

    @Transactional
    public void deactivateCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        // Soft delete to preserve order history
        customer.setActive(false);
        customerRepository.save(customer);
    }
}
