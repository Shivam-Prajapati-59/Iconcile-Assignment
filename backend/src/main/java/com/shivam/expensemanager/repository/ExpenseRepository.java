package com.shivam.expensemanager.repository;

import com.shivam.expensemanager.model.Expense;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByOccurredAtBetweenOrderByOccurredAtDesc(LocalDateTime start, LocalDateTime end);

    @Query("select avg(e.amount) from Expense e where e.category=:category and e.transactionType=com.shivam.expensemanager.model.TransactionType.EXPENSE")
    BigDecimal categoryAverage(@Param("category") String category);
}
