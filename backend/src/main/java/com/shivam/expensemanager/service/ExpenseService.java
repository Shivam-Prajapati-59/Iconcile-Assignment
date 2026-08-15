package com.shivam.expensemanager.service;

import com.shivam.expensemanager.api.*;
import com.shivam.expensemanager.model.*;
import com.shivam.expensemanager.repository.*;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenses;
    private final VendorCategoryRuleRepository rules;
    private final Validator validator;
    private final ExpenseService self;

    public ExpenseService(ExpenseRepository e, VendorCategoryRuleRepository r, Validator v,
            @Lazy ExpenseService self) {
        expenses = e;
        rules = r;
        validator = v;
        this.self = self;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
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

    /**
     * Imports CSV rows so each row is persisted in its own independent transaction
     * (via {@code self.create}, a Spring-managed proxy honoring REQUIRES_NEW). A
     * failing row rolls back only itself and is collected as a row error, while
     * previously imported rows remain committed.
     */
    public ImportResult importCsv(String content) {
        return importCsv(CsvParser.parse(content));
    }

    public ImportResult importCsv(InputStream input) throws IOException {
        return importCsv(CsvParser.parse(new InputStreamReader(input, StandardCharsets.UTF_8)));
    }

    private ImportResult importCsv(List<List<String>> rows) {
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
                String currency = row.get(2).isBlank() ? "INR" : row.get(2).toUpperCase(Locale.ROOT);
                if (!"INR".equals(currency)) {
                    throw new IllegalArgumentException("Only INR currency is supported");
                }
                TransactionType type = TransactionType.valueOf(row.get(3).toUpperCase(Locale.ROOT));
                Expense saved = self.create(new ExpenseRequest(
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
        return expenses.findByOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(start, end);
    }

    public ExpensePage page(YearMonth month, int page, int size) {
        return page(month, page, size, null, null, null);
    }

    public ExpensePage page(YearMonth month, int page, int size,
            List<String> vendors, List<String> categories, List<String> types) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
                Sort.by(Sort.Order.desc("occurredAt"), Sort.Order.desc("id")));
        Page<Expense> result = expenses.findAll(filters(month, vendors, categories, types), pageable);
        return new ExpensePage(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.hasNext());
    }

    private static Specification<Expense> filters(YearMonth month,
            List<String> vendors, List<String> categories, List<String> types) {
        Specification<Expense> spec = (root, query, cb) -> cb.conjunction();
        if (month != null) {
            LocalDateTime start = month.atDay(1).atStartOfDay();
            LocalDateTime end = month.plusMonths(1).atDay(1).atStartOfDay();
            spec = spec.and((root, query, cb) -> cb.and(
                    cb.greaterThanOrEqualTo(root.get("occurredAt"), start),
                    cb.lessThan(root.get("occurredAt"), end)));
        }
        List<String> vendorNames = cleanFilters(vendors);
        if (vendorNames != null) {
            List<String> lowered = vendorNames.stream()
                    .map(v -> v.toLowerCase(Locale.ROOT))
                    .toList();
            spec = spec.and((root, query, cb) -> cb.lower(root.get("vendorName")).in(lowered));
        }
        List<String> categoryNames = cleanFilters(categories);
        if (categoryNames != null) {
            spec = spec.and((root, query, cb) -> root.get("category").in(categoryNames));
        }
        List<TransactionType> typeValues = cleanTypes(types);
        if (typeValues != null) {
            spec = spec.and((root, query, cb) -> root.get("transactionType").in(typeValues));
        }
        return spec;
    }

    private static List<String> cleanFilters(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        List<String> cleaned = values.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private static List<TransactionType> cleanTypes(List<String> values) {
        List<String> cleaned = cleanFilters(values);
        if (cleaned == null) {
            return null;
        }
        return cleaned.stream()
                .map(v -> {
                    try {
                        return TransactionType.valueOf(v.toUpperCase(Locale.ROOT));
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Invalid transaction type: " + v);
                    }
                })
                .toList();
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
        Map<String, String> vendorDisplay = new HashMap<>();
        List<Expense> anomalies = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Expense e : list) {
            if (e.getTransactionType() != TransactionType.EXPENSE) {
                continue;
            }
            total = total.add(e.getAmount());
            categories.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
            String vendorKey = e.getVendorName().toLowerCase(Locale.ROOT);
            vendors.merge(vendorKey, e.getAmount(), BigDecimal::add);
            String existing = vendorDisplay.get(vendorKey);
            if (existing == null
                    || (!Character.isUpperCase(existing.charAt(0))
                            && Character.isUpperCase(e.getVendorName().charAt(0)))) {
                vendorDisplay.put(vendorKey, e.getVendorName());
            }
            if (e.isAnomaly()) {
                anomalies.add(e);
            }
        }

        var top = vendors.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(5)
                .map(x -> Map.of("vendor", vendorDisplay.getOrDefault(x.getKey(), x.getKey()),
                        "total", x.getValue()))
                .toList();

        return Map.of(
                "totalSpend", total,
                "categoryTotals", categories,
                "topVendors", top,
                "anomalyCount", anomalies.size(),
                "anomalies", anomalies);
    }
}
