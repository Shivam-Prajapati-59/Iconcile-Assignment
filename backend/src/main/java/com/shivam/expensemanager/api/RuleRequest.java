package com.shivam.expensemanager.api;

import jakarta.validation.constraints.*;

public record RuleRequest(@NotBlank @Size(max = 255) String vendorName, @NotBlank @Size(max = 100) String category) {
}
