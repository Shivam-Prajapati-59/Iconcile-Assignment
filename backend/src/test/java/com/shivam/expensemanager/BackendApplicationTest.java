package com.shivam.expensemanager;

import static org.assertj.core.api.Assertions.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Verifies {@link BackendApplication#loadDotenv()} in a fresh child JVM so that
 * conflicting values actually observed by {@code System.getenv} / system
 * properties are honored over the local {@code .env} file.
 */
class BackendApplicationTest {

    @TempDir
    Path tempEnvDir;

    @BeforeEach
    void writeDotenv() throws IOException {
        Files.writeString(tempEnvDir.resolve(".env"),
                "DATABASE_URL=jdbc:postgresql://dotenv-host/db\nPORT=1111\n");
    }

    public static class Child {
        public static void main(String[] args) {
            BackendApplication.loadDotenv();
            System.out.println("PROPERTY=" + System.getProperty("DATABASE_URL"));
        }
    }

    private String runChild(ProcessBuilder pb) throws Exception {
        Process process = pb.start();
        if (!process.waitFor(30, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            fail("child process timed out");
        }
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String error = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        assertThat(process.exitValue()).as("child stderr: %s", error).isZero();
        return output;
    }

    private ProcessBuilder childProcess(String... jvmArgs) {
        String javaBin = Path.of(System.getProperty("java.home"), "bin", "java").toString();
        String classpath = System.getProperty("surefire.test.class.path",
                System.getProperty("java.class.path"));
        ProcessBuilder pb = new ProcessBuilder(javaBin, "-cp", classpath);
        pb.command().addAll(java.util.List.of(jvmArgs));
        pb.command().add(Child.class.getName());
        pb.directory(tempEnvDir.toFile());
        return pb;
    }

    @Test
    void osEnvironmentVariableWinsOverDotenv() throws Exception {
        ProcessBuilder pb = childProcess();
        pb.environment().put("DATABASE_URL", "jdbc:postgresql://os-host/db");
        String output = runChild(pb);
        assertThat(output).contains("PROPERTY=null");
    }

    @Test
    void jvmSystemPropertyWinsOverDotenv() throws Exception {
        String output = runChild(childProcess("-DDATABASE_URL=jdbc:postgresql://prop-host/db"));
        assertThat(output).contains("PROPERTY=jdbc:postgresql://prop-host/db");
    }

    @Test
    void dotenvIsAppliedWhenNothingOverridesIt() throws Exception {
        String output = runChild(childProcess());
        assertThat(output).contains("PROPERTY=jdbc:postgresql://dotenv-host/db");
    }
}
