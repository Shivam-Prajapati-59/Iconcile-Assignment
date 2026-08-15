package com.shivam.expensemanager.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "expenses")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;
    @Column(name = "account_name")
    private String accountName;
    @Column(name = "vendor_name", nullable = false)
    private String vendorName;
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String description;
    @Column(nullable = false)
    private String category;
    @Column(name = "is_anomaly", nullable = false)
    private boolean anomaly;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void create() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void update() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime v) {
        occurredAt = v;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal v) {
        amount = v;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String v) {
        currency = v;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType v) {
        transactionType = v;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String v) {
        accountName = v;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String v) {
        vendorName = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String v) {
        category = v;
    }

    public boolean isAnomaly() {
        return anomaly;
    }

    public void setAnomaly(boolean v) {
        anomaly = v;
    }
}
