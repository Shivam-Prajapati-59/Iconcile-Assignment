package com.shivam.expensemanager.controller;

import com.shivam.expensemanager.api.*;
import com.shivam.expensemanager.model.*;
import com.shivam.expensemanager.service.ExpenseService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ExpenseController {
    private final ExpenseService service;

    public ExpenseController(ExpenseService s) {
        service = s;
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public Expense create(@Valid @RequestBody ExpenseRequest r) {
        return service.create(r);
    }

    @GetMapping("/expenses")
    public List<Expense> list(@RequestParam(required = false) String month) {
        return service.list(month == null ? null : YearMonth.parse(month));
    }

    @PostMapping(value = "/expenses/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResult upload(@RequestParam MultipartFile file) throws Exception {
        return service.importCsv(new String(file.getBytes(), StandardCharsets.UTF_8));
    }

    @GetMapping("/vendor-rules")
    public List<VendorCategoryRule> rules() {
        return service.rules();
    }

    @PostMapping("/vendor-rules")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorCategoryRule addRule(@Valid @RequestBody RuleRequest r) {
        return service.addRule(r);
    }

    @PutMapping("/vendor-rules/{id}")
    public VendorCategoryRule updateRule(@PathVariable long id, @Valid @RequestBody RuleRequest r) {
        return service.updateRule(id, r);
    }

    @DeleteMapping("/vendor-rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRule(@PathVariable long id) {
        service.deleteRule(id);
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> dashboard(@RequestParam String month) {
        return service.dashboard(YearMonth.parse(month));
    }
}
