package com.shivam.expensemanager.controller;

import static org.assertj.core.api.Assertions.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.http.server.LocalTestWebServer;
import org.springframework.context.ApplicationContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ExpenseApiTest {

    @Autowired
    ApplicationContext context;

    private final HttpClient http = HttpClient.newHttpClient();

    private int getStatus(String path) throws Exception {
        LocalTestWebServer server = LocalTestWebServer.get(context);
        HttpRequest request = HttpRequest.newBuilder(URI.create(server.uri(path))).GET().build();
        return http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode();
    }

    private int postStatus(String path, String jsonBody) throws Exception {
        LocalTestWebServer server = LocalTestWebServer.get(context);
        HttpRequest request = HttpRequest.newBuilder(URI.create(server.uri(path)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString()).statusCode();
    }

    @Test
    void invalidMonthOnExpenseListReturns400() throws Exception {
        assertThat(getStatus("/api/expenses?month=not-a-month")).isEqualTo(400);
    }

    @Test
    void invalidMonthOnDashboardReturns400() throws Exception {
        assertThat(getStatus("/api/dashboard/summary?month=2026-13")).isEqualTo(400);
    }

    @Test
    void amountWithTooManyFractionDigitsReturns400() throws Exception {
        String body = """
                {"occurredAt":"2026-08-01T12:30:00","amount":1.001,"currency":"INR","transactionType":"EXPENSE","accountName":"a","vendorName":"Swiggy","description":"x"}""";
        assertThat(postStatus("/api/expenses", body)).isEqualTo(400);
    }

    @Test
    void amountExceedingPrecisionReturns400() throws Exception {
        String body = """
                {"occurredAt":"2026-08-01T12:30:00","amount":10000000000.00,"currency":"INR","transactionType":"EXPENSE","accountName":"a","vendorName":"Swiggy","description":"x"}""";
        assertThat(postStatus("/api/expenses", body)).isEqualTo(400);
    }
}
