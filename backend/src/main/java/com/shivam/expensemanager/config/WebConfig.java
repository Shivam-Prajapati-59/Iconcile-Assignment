package com.shivam.expensemanager.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final List<String> DEFAULT_ORIGINS = List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://iconcile-assignment.vercel.app");

    private final String[] allowedOrigins;

    public WebConfig(@Value("${CORS_ORIGINS:}") String corsOrigins) {
        this.allowedOrigins = corsOrigins == null || corsOrigins.isBlank()
                ? DEFAULT_ORIGINS.toArray(String[]::new)
                : Arrays.stream(corsOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
