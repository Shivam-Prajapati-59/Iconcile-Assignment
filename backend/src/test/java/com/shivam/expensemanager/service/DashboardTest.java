package com.shivam.expensemanager.service;

import static org.assertj.core.api.Assertions.*;

import com.shivam.expensemanager.api.ExpenseRequest;
import com.shivam.expensemanager.api.RuleRequest;
import com.shivam.expensemanager.model.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class DashboardTest {

    @Autowired
    ExpenseService service;

    private void expense(int day, String amount, String vendor) {
        service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 8, day, 12, 0),
                new BigDecimal(amount),
                "INR",
                TransactionType.EXPENSE,
                "card",
                vendor,
                null));
    }

    @Test
    void aggregatesMonthlyTotalsVendorsAndAnomalies() {
        service.addRule(new RuleRequest("Swiggy", "Food"));
        service.addRule(new RuleRequest("Uber", "Transport"));

        expense(3, "100.00", "Swiggy");
        expense(5, "200.00", "Swiggy");
        expense(6, "50.00", "Uber");
        expense(7, "1000.00", "Swiggy");

        // Outside the selected month - must be excluded.
        service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 9, 1, 12, 0),
                new BigDecimal("999.00"),
                "INR",
                TransactionType.EXPENSE,
                "card",
                "Swiggy",
                null));
        // Income - must be excluded from spend totals.
        service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 8, 10, 12, 0),
                new BigDecimal("5000.00"),
                "INR",
                TransactionType.INCOME,
                "card",
                "Employer",
                null));

        Map<String, Object> summary = service.dashboard(YearMonth.of(2026, 8));

        assertThat((BigDecimal) summary.get("totalSpend")).isEqualByComparingTo("1350.00");
        assertThat((Map<String, BigDecimal>) summary.get("categoryTotals"))
                .containsEntry("Food", new BigDecimal("1300.00"))
                .containsEntry("Transport", new BigDecimal("50.00"));

        List<?> top = (List<?>) summary.get("topVendors");
        assertThat(top).hasSize(2);
        Map<String, Object> first = (Map<String, Object>) top.get(0);
        assertThat(first).containsEntry("vendor", "Swiggy");
        assertThat((BigDecimal) first.get("total")).isEqualByComparingTo("1300.00");

        assertThat((Integer) summary.get("anomalyCount")).isEqualTo(1);
        assertThat((List<?>) summary.get("anomalies")).hasSize(1);
    }

    @Test
    void emptyMonthReturnsZeroedSummary() {
        Map<String, Object> summary = service.dashboard(YearMonth.of(2026, 3));
        assertThat((BigDecimal) summary.get("totalSpend")).isEqualByComparingTo("0");
        assertThat((Map<String, BigDecimal>) summary.get("categoryTotals")).isEmpty();
        assertThat((List<?>) summary.get("topVendors")).isEmpty();
        assertThat((Integer) summary.get("anomalyCount")).isZero();
    }
}
