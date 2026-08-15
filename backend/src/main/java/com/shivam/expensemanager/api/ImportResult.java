package com.shivam.expensemanager.api;

import java.util.List;

public record ImportResult(int importedRows, int failedRows, int anomalyCount, List<RowError> errors) {

    public record RowError(int row, String message) {
    }
}
