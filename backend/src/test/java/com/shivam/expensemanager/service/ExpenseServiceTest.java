package com.shivam.expensemanager.service;

import static org.assertj.core.api.Assertions.*;

import com.shivam.expensemanager.api.ExpenseRequest;
import com.shivam.expensemanager.api.ExpensePage;
import com.shivam.expensemanager.api.RuleRequest;
import com.shivam.expensemanager.model.Expense;
import com.shivam.expensemanager.model.TransactionType;
import com.shivam.expensemanager.model.VendorCategoryRule;
import com.shivam.expensemanager.repository.ExpenseRepository;
import com.shivam.expensemanager.repository.VendorCategoryRuleRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;

@SpringBootTest
class ExpenseServiceTest {

    @Autowired
    ExpenseService service;

    @Autowired
    ExpenseRepository expenses;

    @Autowired
    VendorCategoryRuleRepository rules;

    @BeforeEach
    void cleanDatabase() {
        expenses.deleteAll();
        rules.deleteAll();
    }

    private ExpenseRequest request(String vendor, String amount, TransactionType type) {
        return new ExpenseRequest(
                LocalDateTime.of(2026, 8, 1, 12, 0),
                new BigDecimal(amount),
                "INR",
                type,
                "Demo account",
                vendor,
                "test");
    }

    @Test
    void categorizesKnownVendorCaseInsensitively() {
        service.addRule(new RuleRequest("Swiggy", "Food"));
        Expense e = service.create(request("  sWIgGy  ", "250.00", TransactionType.EXPENSE));
        assertThat(e.getCategory()).isEqualTo("Food");
    }

    @Test
    void fallsBackToUncategorizedForUnknownVendor() {
        Expense e = service.create(request("Local Kirana Store", "250.00", TransactionType.EXPENSE));
        assertThat(e.getCategory()).isEqualTo("Uncategorized");
    }

    @Test
    void firstExpenseInCategoryIsNotAnomalous() {
        Expense e = service.create(request("Swiggy", "100.00", TransactionType.EXPENSE));
        assertThat(e.isAnomaly()).isFalse();
    }

    @Test
    void exactlyThreeTimesAverageIsNotAnomalous() {
        service.create(request("Swiggy", "100.00", TransactionType.EXPENSE));
        Expense e = service.create(request("Swiggy", "300.00", TransactionType.EXPENSE));
        assertThat(e.isAnomaly()).isFalse();
    }

    @Test
    void moreThanThreeTimesAverageIsAnomalous() {
        service.create(request("Swiggy", "100.00", TransactionType.EXPENSE));
        Expense e = service.create(request("Swiggy", "300.01", TransactionType.EXPENSE));
        assertThat(e.isAnomaly()).isTrue();
    }

    @Test
    void incomeIsNeverAnomalous() {
        service.addRule(new RuleRequest("Employer", "Salary"));
        service.create(request("Employer", "100.00", TransactionType.EXPENSE));
        Expense e = service.create(request("Employer", "100000.00", TransactionType.INCOME));
        assertThat(e.isAnomaly()).isFalse();
    }

    @Test
    void updatingRuleAffectsOnlyFutureExpenses() {
        service.addRule(new RuleRequest("Domino's", "Food"));
        Expense before = service.create(request("Domino's", "100.00", TransactionType.EXPENSE));
        assertThat(before.getCategory()).isEqualTo("Food");

        List<VendorCategoryRule> rules = service.rules();
        service.updateRule(rules.get(0).getId(), new RuleRequest("Domino's", "Shopping"));

        Expense after = service.create(request("Domino's", "100.00", TransactionType.EXPENSE));
        assertThat(before.getCategory()).isEqualTo("Food");
        assertThat(after.getCategory()).isEqualTo("Shopping");
    }

    @Test
    void duplicateRuleIsRejected() {
        service.addRule(new RuleRequest("Swiggy", "Food"));
        assertThatThrownBy(() -> service.addRule(new RuleRequest(" swiggy ", "Shopping")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsInvalidExpense() {
        assertThatThrownBy(() -> service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 8, 1, 12, 0),
                new BigDecimal("-10.00"),
                "INR",
                TransactionType.EXPENSE,
                "x",
                "Swiggy",
                null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private Expense createOnDay(int day, String vendor) {
        return service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 8, day, 12, 0),
                new BigDecimal("10.00"),
                "INR",
                TransactionType.EXPENSE,
                "card",
                vendor,
                null));
    }

    @Test
    void paginatesNewestFirstAcrossPages() {
        createOnDay(1, "Alpha");
        createOnDay(2, "Beta");
        createOnDay(3, "Gamma");
        createOnDay(4, "Delta");

        ExpensePage first = service.page(null, 0, 2);
        assertThat(first.items()).extracting(Expense::getVendorName)
                .containsExactly("Delta", "Gamma");
        assertThat(first.totalItems()).isEqualTo(4);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.hasNext()).isTrue();

        ExpensePage second = service.page(null, 1, 2);
        assertThat(second.items()).extracting(Expense::getVendorName)
                .containsExactly("Beta", "Alpha");
        assertThat(second.hasNext()).isFalse();
    }

    @Test
    void paginatesWithinSelectedMonth() {
        createOnDay(1, "August");
        service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 9, 1, 12, 0),
                new BigDecimal("10.00"),
                "INR",
                TransactionType.EXPENSE,
                "card",
                "September",
                null));

        ExpensePage page = service.page(YearMonth.of(2026, 8), 0, 10);
        assertThat(page.items()).extracting(Expense::getVendorName)
                .containsExactly("August");
        assertThat(page.totalItems()).isEqualTo(1);
        assertThat(page.hasNext()).isFalse();
    }
}
