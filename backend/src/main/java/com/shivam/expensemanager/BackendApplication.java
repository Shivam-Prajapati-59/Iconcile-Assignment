package com.shivam.expensemanager;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		loadDotenv();
		SpringApplication.run(BackendApplication.class, args);
	}

	/**
	 * Applies each {@code .env} entry as a system property only when neither a JVM
	 * system property nor an OS environment variable already provides a value, so
	 * deployment-provided values (e.g. {@code DATABASE_URL}, {@code PORT}) win.
	 */
	public static void loadDotenv() {
		Dotenv.configure().ignoreIfMissing().load().entries().stream()
				.filter(entry -> System.getProperty(entry.getKey()) == null
						&& System.getenv(entry.getKey()) == null)
				.forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
	}

}
