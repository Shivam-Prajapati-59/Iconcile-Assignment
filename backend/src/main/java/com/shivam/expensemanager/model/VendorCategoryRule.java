package com.shivam.expensemanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vendor_category_rules")
public class VendorCategoryRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "normalized_vendor_name", nullable = false, unique = true)
    private String normalizedVendorName;
    @Column(nullable = false)
    private String category;

    public Long getId() {
        return id;
    }

    public String getNormalizedVendorName() {
        return normalizedVendorName;
    }

    public void setNormalizedVendorName(String v) {
        normalizedVendorName = v;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String v) {
        category = v;
    }
}
