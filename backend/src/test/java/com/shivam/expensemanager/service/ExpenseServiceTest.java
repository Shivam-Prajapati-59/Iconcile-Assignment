package com.shivam.expensemanager.service;

import static org.assertj.core.api.Assertions.*;

import com.shivam.expensemanager.api.ExpenseRequest;
import com.shivam.expensemanager.api.RuleRequest;
import com.shivam.expensemanager.model.Expense;
import com.shivam.expensemanager.model.TransactionType;
import com.shivam.expensemanager.model.VendorCategoryRule;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ExpenseServiceTest {

    @Autowired
    ExpenseService service;

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
}
