package com.ero;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EmergencyResponseOptimizerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmergencyResponseOptimizerApplication.class, args);
        System.out.println("\n==========================================");
        System.out.println("🚨 ERO Backend Server Started Successfully!");
        System.out.println("🌐 Server running at: http://localhost:8080");
        System.out.println("📡 WebSocket endpoint: ws://localhost:8080/ws");
        System.out.println("==========================================\n");
    }
}
