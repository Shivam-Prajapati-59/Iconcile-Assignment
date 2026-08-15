package com.shivam.expensemanager.api;

import com.shivam.expensemanager.model.TransactionType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExpenseRequest(@NotNull LocalDateTime occurredAt,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
        @Pattern(regexp = "[A-Za-z]{3}") String currency, @NotNull TransactionType transactionType,
        @Size(max = 255) String accountName, @NotBlank @Size(max = 255) String vendorName,
        @Size(max = 5000) String description) {
}
