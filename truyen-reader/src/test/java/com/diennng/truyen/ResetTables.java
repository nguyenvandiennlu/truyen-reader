package com.diennng.truyen;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class ResetTables {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.aktpjeyoosjyzdqcexsv";
        String pass = "uAAKrBb-/5.hRkp";
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            System.out.println("Connected to Supabase! Resetting tables...");
            stmt.executeUpdate("DROP TABLE IF EXISTS chapter CASCADE;");
            stmt.executeUpdate("DROP TABLE IF EXISTS story CASCADE;");
            System.out.println("Tables dropped successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
