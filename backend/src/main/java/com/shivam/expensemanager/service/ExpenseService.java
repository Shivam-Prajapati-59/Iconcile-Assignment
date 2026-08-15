package com.shivam.expensemanager.service;

import com.shivam.expensemanager.api.*;
import com.shivam.expensemanager.model.*;
import com.shivam.expensemanager.repository.*;
import jakarta.transaction.Transactional;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.math.*;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ExpenseService {

    private final ExpenseRepository expenses;
    private final VendorCategoryRuleRepository rules;
    private final Validator validator;

    public ExpenseService(ExpenseRepository e, VendorCategoryRuleRepository r, Validator v) {
        expenses = e;
        rules = r;
        validator = v;
    }

    private static final BigDecimal ANOMALY_THRESHOLD_MULTIPLIER = BigDecimal.valueOf(3);

    private String norm(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private void validate(ExpenseRequest request) {
        Set<ConstraintViolation<ExpenseRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String message = violations.stream()
                    .map(v -> v.getPropertyPath() + " " + v.getMessage())
                    .collect(Collectors.joining("; "));
            throw new IllegalArgumentException(message);
        }
    }

    @Transactional
    public Expense create(ExpenseRequest request) {
        validate(request);
        Expense e = new Expense();
        e.setOccurredAt(request.occurredAt());
        e.setAmount(request.amount());
        e.setCurrency(request.currency() == null ? "INR" : request.currency().toUpperCase(Locale.ROOT));
        e.setTransactionType(request.transactionType());
        e.setAccountName(request.accountName());
        e.setVendorName(request.vendorName().trim());
        e.setDescription(request.description());

        String category = categorize(e.getVendorName());
        e.setCategory(category);

        BigDecimal average = expenses.categoryAverage(category);
        e.setAnomaly(e.getTransactionType() == TransactionType.EXPENSE
                && average != null
                && e.getAmount().compareTo(average.multiply(ANOMALY_THRESHOLD_MULTIPLIER)) > 0);
        return expenses.save(e);
    }

    /**
     * Applies the first vendor rule that matches the trimmed, lower-cased vendor
     * name; falls back to {@code Uncategorized}.
     */
    public String categorize(String vendorName) {
        return rules.findByNormalizedVendorName(norm(vendorName))
                .map(VendorCategoryRule::getCategory)
                .orElse("Uncategorized");
    }

    @Transactional
    public ImportResult importCsv(String content) {
        List<List<String>> rows = CsvParser.parse(content);
        if (rows.size() < 2) {
            throw new IllegalArgumentException("CSV must include a header and at least one row");
        }

        int imported = 0;
        int anomalies = 0;
        List<ImportResult.RowError> errors = new ArrayList<>();

        for (int i = 1; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            if (row.stream().allMatch(String::isBlank)) {
                continue;
            }
            if (row.size() != 7) {
                errors.add(new ImportResult.RowError(i + 1, "Expected 7 columns, found " + row.size()));
                continue;
            }
            try {
                String currency = row.get(2).isBlank() ? "INR" : row.get(2);
                TransactionType type = TransactionType.valueOf(row.get(3).toUpperCase(Locale.ROOT));
                Expense saved = create(new ExpenseRequest(
                        parseOccurredAt(row.get(0)),
                        new BigDecimal(row.get(1)),
                        currency,
                        type,
                        row.get(4),
                        row.get(5),
                        row.get(6)));
                imported++;
                if (saved.isAnomaly()) {
                    anomalies++;
                }
            } catch (Exception e) {
                errors.add(new ImportResult.RowError(i + 1,
                        e.getMessage() == null ? "Invalid row" : e.getMessage()));
            }
        }
        return new ImportResult(imported, errors.size(), anomalies, errors);
    }

    private static LocalDateTime parseOccurredAt(String raw) {
        String value = raw.trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException("date is required");
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ignored) {
            // fall through to date-only form
        }
        try {
            return LocalDate.parse(value).atStartOfDay();
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date '" + raw + "' (expected YYYY-MM-DD or ISO date-time)");
        }
    }

    public List<Expense> list(YearMonth month) {
        if (month == null) {
            return expenses.findAll().stream()
                    .sorted(Comparator.comparing(Expense::getOccurredAt).reversed())
                    .toList();
        }
        LocalDateTime start = month.atDay(1).atStartOfDay();
        LocalDateTime end = month.plusMonths(1).atDay(1).atStartOfDay();
        return expenses.findByOccurredAtBetweenOrderByOccurredAtDesc(start, end);
    }

    @Transactional
    public VendorCategoryRule addRule(RuleRequest request) {
        VendorCategoryRule rule = new VendorCategoryRule();
        rule.setNormalizedVendorName(norm(request.vendorName()));
        rule.setCategory(request.category().trim());
        return rules.save(rule);
    }

    public List<VendorCategoryRule> rules() {
        return rules.findAll();
    }

    @Transactional
    public VendorCategoryRule updateRule(long id, RuleRequest request) {
        VendorCategoryRule rule = rules.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Rule not found"));
        rule.setNormalizedVendorName(norm(request.vendorName()));
        rule.setCategory(request.category().trim());
        return rules.save(rule);
    }

    public void deleteRule(long id) {
        if (!rules.existsById(id)) {
            throw new NoSuchElementException("Rule not found");
        }
        rules.deleteById(id);
    }

    public Map<String, Object> dashboard(YearMonth month) {
        List<Expense> list = list(month);
        Map<String, BigDecimal> categories = new TreeMap<>();
        Map<String, BigDecimal> vendors = new HashMap<>();
        List<Expense> anomalies = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Expense e : list) {
            if (e.getTransactionType() != TransactionType.EXPENSE) {
                continue;
            }
            total = total.add(e.getAmount());
            categories.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
            vendors.merge(e.getVendorName(), e.getAmount(), BigDecimal::add);
            if (e.isAnomaly()) {
                anomalies.add(e);
            }
        }

        var top = vendors.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .map(x -> Map.of("vendor", x.getKey(), "total", x.getValue()))
                .toList();

        return Map.of(
                "totalSpend", total,
                "categoryTotals", categories,
                "topVendors", top,
                "anomalyCount", anomalies.size(),
                "anomalies", anomalies);
    }
}
