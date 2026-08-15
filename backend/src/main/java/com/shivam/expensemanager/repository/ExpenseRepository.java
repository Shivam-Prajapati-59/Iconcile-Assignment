package com.shivam.expensemanager.repository;

import com.shivam.expensemanager.model.Expense;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {
        List<Expense> findByOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                        LocalDateTime start, LocalDateTime end);

        @Query("select cast(avg(e.amount) as java.math.BigDecimal) from Expense e where e.category=:category and e.transactionType=com.shivam.expensemanager.model.TransactionType.EXPENSE")
        BigDecimal categoryAverage(@Param("category") String category);
}
