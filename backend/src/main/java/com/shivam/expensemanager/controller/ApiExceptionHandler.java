package com.shivam.expensemanager.controller;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({ IllegalArgumentException.class, MethodArgumentNotValidException.class,
            HttpMessageNotReadableException.class })
    ResponseEntity<Map<String, Object>> bad(Exception e) {
        String message = e.getMessage() == null ? "Validation failed" : e.getMessage();
        if (e instanceof HttpMessageNotReadableException) {
            message = "Malformed request body: expected valid JSON matching the API contract";
        }
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, Object>> conflict(DataIntegrityViolationException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "The request conflicts with existing data (e.g. duplicate vendor rule)"));
    }

    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<Map<String, Object>> missing(NoSuchElementException e) {
        return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
    }
}
