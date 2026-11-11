package com.stockflow.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "app", "StockFlow Backend API",
                "status", "UP",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "frontendUrl", "http://localhost:5173",
                "docsUrl", "/swagger-ui.html"
        ));
    }
}
