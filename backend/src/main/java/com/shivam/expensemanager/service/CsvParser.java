package com.shivam.expensemanager.service;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Minimal RFC-4180-aware parser that supports quoted fields, embedded commas
 * and
 * escaped quotes ({@code ""}). Kept deliberately small for this assignment; a
 * production importer would use a dedicated library.
 */
public final class CsvParser {

    private CsvParser() {
    }

    public static List<List<String>> parse(String content) {
        try {
            return parse(new StringReader(content));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static List<List<String>> parse(Reader source) throws IOException {
        PushbackReader reader = new PushbackReader(source, 1);
        List<List<String>> rows = new ArrayList<>();
        List<String> current = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;

        int c;
        while ((c = reader.read()) != -1) {
            char ch = (char) c;
            if (inQuotes) {
                if (ch == '"') {
                    int next = reader.read();
                    if (next == '"') {
                        field.append('"');
                    } else {
                        inQuotes = false;
                        if (next != -1) {
                            reader.unread(next);
                        }
                    }
                } else {
                    field.append(ch);
                }
            } else if (ch == '"') {
                inQuotes = true;
            } else if (ch == ',') {
                current.add(field.toString().trim());
                field.setLength(0);
            } else if (ch == '\n' || ch == '\r') {
                if (ch == '\r') {
                    int next = reader.read();
                    if (next != '\n' && next != -1) {
                        reader.unread(next);
                    }
                }
                current.add(field.toString().trim());
                field.setLength(0);
                rows.add(current);
                current = new ArrayList<>();
            } else {
                field.append(ch);
            }
        }

        if (inQuotes) {
            throw new IllegalArgumentException("Unterminated quoted field at end of input");
        }

        if (field.length() > 0 || !current.isEmpty()) {
            current.add(field.toString().trim());
            rows.add(current);
        }
        return rows;
    }
}
