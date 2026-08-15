package com.shivam.expensemanager.api;

import com.shivam.expensemanager.model.Expense;
import java.util.List;

public record ExpensePage(List<Expense> items, int page, int size, long totalItems, int totalPages,
                boolean hasNext) {
}
