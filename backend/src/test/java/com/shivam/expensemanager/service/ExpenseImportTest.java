package com.shivam.expensemanager.service;

import static org.assertj.core.api.Assertions.*;

import com.shivam.expensemanager.api.ExpenseRequest;
import com.shivam.expensemanager.api.ImportResult;
import com.shivam.expensemanager.api.RuleRequest;
import com.shivam.expensemanager.model.Expense;
import com.shivam.expensemanager.model.TransactionType;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ExpenseImportTest {

    @Autowired
    ExpenseService service;

    @BeforeEach
    void seedDefaultRules() {
        service.addRule(new RuleRequest("Swiggy", "Food"));
        service.addRule(new RuleRequest("Zomato", "Food"));
        service.addRule(new RuleRequest("Uber", "Transport"));
        service.addRule(new RuleRequest("Ola", "Transport"));
        service.addRule(new RuleRequest("Amazon", "Shopping"));
        service.addRule(new RuleRequest("Netflix", "Entertainment"));
        service.addRule(new RuleRequest("Apollo Pharmacy", "Health"));
    }

    private String resource(String name) throws Exception {
        return Files.readString(Path.of("src/test/resources", name), StandardCharsets.UTF_8);
    }

    @Test
    void importsValidCsvAndFlagsAnomalies() throws Exception {
        ImportResult result = service.importCsv(resource("sample-expenses.csv"));
        assertThat(result.importedRows()).isEqualTo(12);
        assertThat(result.failedRows()).isZero();
        assertThat(result.anomalyCount()).isEqualTo(1);
    }

    @Test
    void importsValidRowsAndReportsRowErrors() throws Exception {
        ImportResult result = service.importCsv(resource("sample-invalid-expenses.csv"));
        assertThat(result.importedRows()).isZero();
        assertThat(result.failedRows()).isEqualTo(4);
        assertThat(result.errors()).hasSize(4);
    }

    @Test
    void parsesQuotedFieldsWithCommas() throws Exception {
        String csv = """
                date,amount,currency,transactionType,accountName,vendorName,description
                2026-08-01,100.00,INR,EXPENSE,My Account,Swiggy,"Pizza, large with extra cheese"
                """;
        ImportResult result = service.importCsv(csv);
        assertThat(result.importedRows()).isEqualTo(1);
        assertThat(result.failedRows()).isZero();
    }

    @Test
    void acceptsDateOnlyAndDateTimeCells() throws Exception {
        ImportResult result = service.importCsv("""
                date,amount,currency,transactionType,accountName,vendorName,description
                2026-08-01,100.00,INR,EXPENSE,a,Swiggy,d1
                2026-08-02T10:30:00,200.00,INR,EXPENSE,a,Uber,d2
                """);
        assertThat(result.importedRows()).isEqualTo(2);
        assertThat(result.failedRows()).isZero();
    }

    @Test
    void rejectsCsvWithoutRows() {
        assertThatThrownBy(() -> service.importCsv("date,amount,currency,transactionType,accountName,vendorName,description\n"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void manualCreationAndImportShareCategorization() {
        service.create(new ExpenseRequest(
                LocalDateTime.of(2026, 8, 1, 12, 0),
                new BigDecimal("250.00"),
                "INR",
                TransactionType.EXPENSE,
                "a",
                "swiggy",
                null));
        List<Expense> all = service.list(null);
        assertThat(all).extracting(e -> e.getCategory()).contains("Food");
    }
}
