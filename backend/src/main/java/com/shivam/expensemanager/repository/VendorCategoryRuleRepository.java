package com.shivam.expensemanager.repository;

import com.shivam.expensemanager.model.VendorCategoryRule;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorCategoryRuleRepository extends JpaRepository<VendorCategoryRule, Long> {
    Optional<VendorCategoryRule> findByNormalizedVendorName(String name);
}
