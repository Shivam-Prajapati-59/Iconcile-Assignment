package com.shivam.expensemanager.repository;

import com.shivam.expensemanager.model.Expense;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
        List<Expense> findByOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                        LocalDateTime start, LocalDateTime end);

        Page<Expense> findByOccurredAtGreaterThanEqualAndOccurredAtLessThan(
                        LocalDateTime start, LocalDateTime end, Pageable pageable);

        @Query("select cast(avg(e.amount) as java.math.BigDecimal) from Expense e where e.category=:category and e.transactionType=com.shivam.expensemanager.model.TransactionType.EXPENSE")
        BigDecimal categoryAverage(@Param("category") String category);
}
